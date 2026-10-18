const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

class NotificationService {
  constructor() {
    this.io = null;
    this.emailTransporter = null;
    this.initEmail();
  }

  setSocketIO(io) {
    this.io = io;
  }

  initEmail() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'test_smtp_user') {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log('[NotificationService] Real SMTP Transporter initialized');
      } else {
        // Development mailer stub that logs to console
        this.emailTransporter = {
          sendMail: async (mailOptions) => {
            console.log(`[NotificationService: Dev Email Log] To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
            return { messageId: `dev-simulated-${Date.now()}`, simulated: true };
          },
        };
        console.log('[NotificationService] Using dev simulated email transporter');
      }
    } catch (err) {
      console.warn('[NotificationService] Email setup failed, using logger fallback:', err.message);
    }
  }

  /**
   * Stubbed WhatsApp notification interface
   */
  async sendWhatsAppMessage(phone, messageText) {
    console.log(`[NotificationService: WhatsApp Stub] To: ${phone} | Content: "${messageText}" [WhatsApp API queued/simulated]`);
    return {
      status: 'queued',
      provider: 'whatsapp_stub',
      note: 'Simulated in development. Real provider integration ready for Meta WhatsApp Business Cloud API.',
    };
  }

  /**
   * Dispatch system notification across in-app, socket, email, and WhatsApp stub
   */
  async notify({
    userId,
    userRole,
    title,
    message,
    type = 'system',
    metadata = {},
    recipientEmail = null,
    recipientPhone = null,
  }) {
    try {
      // 1. Create in-app notification in MongoDB
      const notification = await Notification.create({
        userId,
        userRole,
        title,
        message,
        type,
        metadata,
      });

      // 2. Real-time push via Socket.IO if online
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification', {
          id: notification._id,
          title,
          message,
          type,
          metadata,
          createdAt: notification.createdAt,
        });
      }

      // 3. Email dispatch (Nodemailer or dev logger)
      if (recipientEmail && this.emailTransporter) {
        try {
          await this.emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || '"UNFAZED" <notifications@unfazed.in>',
            to: recipientEmail,
            subject: `[UNFAZED] ${title}`,
            text: message,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="margin-bottom: 20px;">
                  <span style="font-size: 20px; font-weight: 700; color: #047857;">UNFAZED</span>
                </div>
                <h2 style="font-size: 18px; color: #1e293b; margin-bottom: 12px;">${title}</h2>
                <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">${message}</p>
                <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                  This is an automated notification from your therapy practice on UNFAZED.
                </div>
              </div>
            `,
          });
        } catch (mailErr) {
          console.warn('[NotificationService] Email delivery warning:', mailErr.message);
        }
      }

      // 4. WhatsApp dispatch stub
      if (recipientPhone) {
        await this.sendWhatsAppMessage(recipientPhone, `${title}: ${message}`);
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService Error]:', error);
      return null;
    }
  }

  // Common application event triggers
  async notifyBookingConfirmed(session, therapist, client) {
    // Notify therapist
    await this.notify({
      userId: therapist._id,
      userRole: 'therapist',
      title: 'New Appointment Booked',
      message: `${client.name} booked a ${session.serviceName} session on ${new Date(session.startDateTime).toLocaleString('en-IN')}.`,
      type: 'booking',
      metadata: { sessionId: session._id, clientId: client._id },
      recipientEmail: therapist.email,
    });

    // Notify client
    await this.notify({
      userId: client._id,
      userRole: 'client',
      title: 'Appointment Confirmed',
      message: `Your session with ${therapist.name} is confirmed for ${new Date(session.startDateTime).toLocaleString('en-IN')}.`,
      type: 'booking',
      metadata: { sessionId: session._id },
      recipientEmail: client.email,
      recipientPhone: client.phone,
    });
  }

  async notifyPaymentSuccess(payment, therapist, client) {
    await this.notify({
      userId: therapist._id,
      userRole: 'therapist',
      title: 'Payment Received',
      message: `Received ₹${payment.amount} from ${client.name} for ${payment.itemDescription} (Inv #${payment.invoiceNumber}).`,
      type: 'payment',
      metadata: { paymentId: payment._id, invoiceNumber: payment.invoiceNumber },
      recipientEmail: therapist.email,
    });

    await this.notify({
      userId: client._id,
      userRole: 'client',
      title: 'Payment Receipt',
      message: `Your payment of ₹${payment.amount} for ${payment.itemDescription} was successful. Invoice #${payment.invoiceNumber} is ready for download.`,
      type: 'payment',
      metadata: { paymentId: payment._id, invoiceNumber: payment.invoiceNumber },
      recipientEmail: client.email,
    });
  }

  async notifyCancellation(session, therapist, client, cancelledByRole) {
    const notifyRole = cancelledByRole === 'therapist' ? 'client' : 'therapist';
    const targetUserId = notifyRole === 'client' ? client._id : therapist._id;
    const email = notifyRole === 'client' ? client.email : therapist.email;

    await this.notify({
      userId: targetUserId,
      userRole: notifyRole,
      title: 'Appointment Cancelled',
      message: `The session on ${new Date(session.startDateTime).toLocaleString('en-IN')} has been cancelled.`,
      type: 'cancellation',
      metadata: { sessionId: session._id },
      recipientEmail: email,
    });
  }
}

module.exports = new NotificationService();
