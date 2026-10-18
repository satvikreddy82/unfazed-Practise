const Payment = require('../models/Payment');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const paymentService = require('../services/paymentService');
const invoiceService = require('../services/invoiceService');
const entitlementService = require('../services/entitlementService');

/**
 * Create Payment Order (Session or Package)
 */
exports.createOrder = async (req, res) => {
  try {
    const { therapistId, clientId, itemType, itemId, amount, itemDescription } = req.body;

    if (!therapistId || !amount || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'therapistId, amount, and itemType are required.',
      });
    }

    // Resolve client ID: if requester is client, use req.user.id
    const resolvedClientId = req.user?.role === 'client' ? req.user.id : clientId;
    if (!resolvedClientId) {
      return res.status(400).json({ success: false, message: 'clientId is required.' });
    }

    const orderData = await paymentService.createOrder({
      therapistId,
      clientId: resolvedClientId,
      itemType,
      itemId,
      amount: parseFloat(amount),
      itemDescription: itemDescription || 'Therapy Consultation',
    });

    res.status(201).json({ success: true, ...orderData });
  } catch (error) {
    console.error('[Create Order Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment signature or confirm test simulation
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isSimulated } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required.' });
    }

    const verification = await paymentService.verifyPayment({
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isSimulated: !!isSimulated,
    });

    res.json({
      success: true,
      message: 'Payment verified and transaction completed successfully!',
      payment: verification.payment,
    });
  } catch (error) {
    console.error('[Verify Payment Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Razorpay authoritative webhook endpoint
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const event = req.body;

    const result = await paymentService.handleRazorpayWebhook(rawBody, signature, event);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * List payments / invoices for practice
 */
exports.getPayments = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'therapist') {
      query.therapistId = req.user.id;
    } else if (req.user.role === 'client') {
      query.clientId = req.user.id;
    }

    const { status, limit = 50 } = req.query;
    if (status && status !== 'all') query.status = status;

    const payments = await Payment.find(query)
      .populate('therapistId', 'name email practiceDetails')
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Download GST-style PDF Invoice
 */
exports.downloadInvoicePdf = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Authorization check
    if (req.user.role === 'therapist' && payment.therapistId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized invoice access.' });
    }
    if (req.user.role === 'client' && payment.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized invoice access.' });
    }

    const [therapist, client] = await Promise.all([
      Therapist.findById(payment.therapistId),
      Client.findById(payment.clientId),
    ]);

    const pdfBuffer = await invoiceService.generateInvoicePdfBuffer(payment, therapist, client);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${payment.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Invoice PDF Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- PACKAGES -----------------

/**
 * List available packages
 */
exports.getPackages = async (req, res) => {
  try {
    const therapistId = req.query.therapistId || req.user?.id;
    if (!therapistId) {
      return res.status(400).json({ success: false, message: 'Therapist ID required.' });
    }

    const packages = await Package.find({ therapistId, isActive: true }).sort({ sessionCount: 1 });
    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new Package (gated by Pro/Practice entitlement)
 */
exports.createPackage = async (req, res) => {
  try {
    const { name, sessionCount, price, discountPercent, description, validityDays } = req.body;

    if (!name || !sessionCount || !price) {
      return res.status(400).json({ success: false, message: 'Name, session count (3, 6, 12), and price are required.' });
    }

    // Entitlement Check: packages enabled
    const check = await entitlementService.canAccess(req.user.id, 'packages');
    if (!check.allowed) {
      return res.status(403).json({
        success: false,
        entitlementError: true,
        message: check.reason,
      });
    }

    const pkg = await Package.create({
      therapistId: req.user.id,
      name,
      sessionCount: parseInt(sessionCount, 10),
      price: parseFloat(price),
      discountPercent: discountPercent || 0,
      description: description || '',
      validityDays: validityDays || 90,
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Package created successfully.', package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Client Package Balance
 */
exports.getClientPackages = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Check authorization: therapist owns client, or client is self
    if (req.user.role === 'client' && req.user.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const clientPackages = await ClientPackage.find({ clientId, status: 'active' })
      .populate('packageId', 'name sessionCount price')
      .sort({ createdAt: -1 });

    res.json({ success: true, clientPackages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
