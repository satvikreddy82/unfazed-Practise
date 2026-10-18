const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authenticate, requireRole } = require('../middleware/auth');

// Notes access: authenticate both therapists and clients (privacy barrier handled inside controller)
router.get('/', authenticate, notesController.getNotes);
router.get('/:id', authenticate, notesController.getNoteById);

// Creation, editing, and deletion: Therapist only
router.post('/', authenticate, requireRole('therapist'), notesController.createNote);
router.put('/:id', authenticate, requireRole('therapist'), notesController.updateNote);
router.delete('/:id', authenticate, requireRole('therapist'), notesController.deleteNote);

module.exports = router;
