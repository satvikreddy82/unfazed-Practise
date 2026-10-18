const express = require('express');
const router = express.Router();
const subscriptionsController = require('../controllers/subscriptionsController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public route to view tiers
router.get('/tiers', subscriptionsController.getTiers);

// Private therapist subscription management
router.get('/current', authenticate, requireRole('therapist'), subscriptionsController.getCurrentSubscription);
router.post('/change-tier', authenticate, requireRole('therapist'), subscriptionsController.changeTier);

module.exports = router;
