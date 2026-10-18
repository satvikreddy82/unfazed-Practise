const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const notificationService = require('./notificationService');

class PaymentService {
  constructor() {
    this.razorpay = null;
    this.isLiveMode = false;
    this.initRazorpay();
  }

  initRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && keyId !== 'rzp_test_placeholder_key_id' && !keyId.includes('placeholder')) {
      try {
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        this.isLiveMode = true;
        console.log('[PaymentService] Razorpay client initialized in test/live mode');
      } catch (err) {
        console.warn('[PaymentService] Razorpay init failed, falling back to simulator:', err.message);
      }
    } else {
      console.log('[PaymentService] Razorpay placeholder detected. Test payment simulator active.');
    }
  }

  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${year}-${randomHex}`;
  }

  /**
   * Create an order for a session or package
   */
  async createOrder({ therapistId, clientId, itemType, itemId, amount, itemDescription }) {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) throw new Error('Therapist not found');

    const client = await Client.findById(clientId);
    if (!client) throw new Error('Client not found');

    const invoiceNumber = this.generateInvoiceNumber();

    // GST calculation if therapist has GST number
    const hasGst = !!therapist.practiceDetails?.gstNumber;
    const gstRatePercent = hasGst ? 18 : 0;
    let subtotal = amount;
    let totalTax = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;

    if (hasGst) {
      // Amount is inclusive of GST
      subtotal = Number((amount / (1 + gstRatePercent / 100)).toFixed(2));
      totalTax = Number((amount - subtotal).toFixed(2));
      cgstAmount = Number((totalTax / 2).toFixed(2));
      sgstAmount = Number((totalTax / 2).toFixed(2));
    }

    let orderId = `sim_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let isSimulated = true;

    // Use actual Razorpay if keys are configured
    if (this.isLiveMode && this.razorpay) {
      try {
        const rzpOrder = await this.razorpay.orders.create({
          amount: Math.round(amount * 100), // amount in paise
          currency: 'INR',
          receipt: invoiceNumber,
          notes: {
            therapistId: therapistId.toString(),
            clientId: clientId.toString(),
            itemType,
            itemId: itemId ? itemId.toString() : '',
          },
        });
        orderId = rzpOrder.id;
        isSimulated = false;
      } catch (err) {
        console.warn('[PaymentService] Razorpay order creation failed, falling back to simulator:', err.message);
      }
    }

    // Create Payment record in DB
    const payment = await Payment.create({
      therapistId,
      clientId,
      amount,
      currency: 'INR',
      status: 'created',
      itemType,
      itemId,
      itemDescription,
      razorpayOrderId: orderId,
      invoiceNumber,
      taxDetails: {
        hasGst,
        gstRatePercent,
        subtotal,
        cgstAmount,
        sgstAmount,
        totalTax,
      },
      isSimulated,
    });

    return {
      paymentId: payment._id,
      orderId,
      amount,
      currency: 'INR',
      invoiceNumber,
      isSimulated,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
    };
  }

  /**
   * Verify and complete payment
   */
  async verifyPayment({
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    isSimulated = false,
  }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment record not found');

    if (payment.status === 'captured') {
      return { success: true, payment, alreadyProcessed: true };
    }

    // Verification check
    if (!payment.isSimulated && this.isLiveMode) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        payment.status = 'failed';
        await payment.save();
        throw new Error('Invalid payment signature verification failed.');
      }
    } else {
      // Test simulator verified
      if (!isSimulated && !payment.isSimulated) {
        throw new Error('Simulation flag mismatch.');
      }
    }

    // Authorize & capture payment
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpayPaymentId || `sim_pay_${Date.now()}`;
    payment.razorpaySignature = razorpaySignature || 'simulated_signature';
    await payment.save();

    // Fulfill purchased item
    await this.fulfillPayment(payment);

    return { success: true, payment };
  }

  /**
   * Fulfill the session or package once payment is captured
   */
  async fulfillPayment(payment) {
    const therapist = await Therapist.findById(payment.therapistId);
    const client = await Client.findById(payment.clientId);

    if (payment.itemType === 'session' && payment.itemId) {
      const session = await Session.findById(payment.itemId);
      if (session) {
        session.paymentStatus = 'paid';
        session.paymentId = payment._id;
        session.status = 'confirmed';
        await session.save();

        if (therapist && client) {
          await notificationService.notifyPaymentSuccess(payment, therapist, client);
        }
      }
    } else if (payment.itemType === 'package' && payment.itemId) {
      // Check idempotency: avoid duplicate package credit
      const existingClientPackage = await ClientPackage.findOne({ paymentId: payment._id });
      if (!existingClientPackage) {
        const pkg = await Package.findById(payment.itemId);
        if (pkg) {
          const validityDays = pkg.validityDays || 90;
          const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

          await ClientPackage.create({
            therapistId: payment.therapistId,
            clientId: payment.clientId,
            packageId: pkg._id,
            paymentId: payment._id,
            packageName: pkg.name,
            sessionsTotal: pkg.sessionCount,
            sessionsUsed: 0,
            sessionsRemaining: pkg.sessionCount,
            expiresAt,
            status: 'active',
          });

          if (therapist && client) {
            await notificationService.notifyPaymentSuccess(payment, therapist, client);
          }
        }
      }
    }
  }

  /**
   * Authoritative Webhook Handler with idempotency
   */
  async handleRazorpayWebhook(rawBody, signature, event) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== 'rzp_webhook_secret_placeholder') {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Webhook signature verification failed');
      }
    }

    const eventId = event.event_id || event.id;
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) return { status: 'ignored' };

    const orderId = paymentEntity.order_id;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) return { status: 'payment_not_found' };

    // Idempotency check
    if (payment.webhookProcessed && payment.webhookEventId === eventId) {
      return { status: 'already_processed' };
    }

    if (event.event === 'payment.captured') {
      payment.status = 'captured';
      payment.razorpayPaymentId = paymentEntity.id;
      payment.webhookProcessed = true;
      payment.webhookEventId = eventId;
      await payment.save();

      await this.fulfillPayment(payment);
      return { status: 'captured_and_fulfilled' };
    }

    if (event.event === 'payment.failed') {
      payment.status = 'failed';
      payment.webhookProcessed = true;
      payment.webhookEventId = eventId;
      await payment.save();
      return { status: 'failed_recorded' };
    }

    return { status: 'unhandled_event' };
  }
}

module.exports = new PaymentService();
