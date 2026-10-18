const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, requireRole } = require('../middleware/auth');

// Private therapist profile management (MUST be before /:slug wildcard)
router.get('/me', authenticate, requireRole('therapist'), profileController.getMyProfile);
router.put('/me', authenticate, requireRole('therapist'), profileController.updateProfile);
router.put('/slug', authenticate, requireRole('therapist'), profileController.updateSlug);
router.put('/theme', authenticate, requireRole('therapist'), profileController.updateThemePreference);

// Public route for branded link
router.get('/:slug', profileController.getPublicProfileBySlug);

module.exports = router;
