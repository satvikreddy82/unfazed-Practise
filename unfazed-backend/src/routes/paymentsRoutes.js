const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public/Client Order creation and verification
router.post('/order', paymentsController.createOrder);
router.post('/verify', paymentsController.verifyPayment);
router.post('/webhook', paymentsController.handleWebhook);

// Protected routes
router.get('/', authenticate, paymentsController.getPayments);
router.get('/invoices/:paymentId/pdf', authenticate, paymentsController.downloadInvoicePdf);

// Package management
router.get('/packages', authenticate, paymentsController.getPackages);
router.post('/packages', authenticate, requireRole('therapist'), paymentsController.createPackage);
router.get('/client-packages/:clientId', authenticate, paymentsController.getClientPackages);

module.exports = router;
