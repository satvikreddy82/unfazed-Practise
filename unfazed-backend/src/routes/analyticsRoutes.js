const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('therapist'), analyticsController.getAnalytics);

module.exports = router;
