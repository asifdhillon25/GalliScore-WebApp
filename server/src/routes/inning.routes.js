const express = require('express');
const router = express.Router();
const inningController = require('../controllers/inning.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const Inning = require('../models/Inning.model');

// Public routes
router.get('/match/:matchId', inningController.getMatchInnings);
router.get('/:id', inningController.getInningById);
router.get('/:id/summary', inningController.getInningSummary);

// Protected routes
router.use(auth);

// Inning management
router.put(
  '/:id',
  authorize('scorer', 'admin'),
  inningController.updateInning
);

// Inning actions
router.post('/:id/declare', authorize('scorer', 'umpire'), inningController.declareInnings);
router.post('/:id/interruption', authorize('scorer', 'umpire'), inningController.addInterruption);
router.post('/:id/interruption/end', authorize('scorer', 'umpire'), inningController.endInterruption);

// Statistics
router.get('/:id/partnership', inningController.getCurrentPartnership);
router.get('/:id/powerplay', inningController.getPowerplayStatus);

// Follow-on (test matches)
router.post('/match/:matchId/followon', authorize('umpire'), inningController.enforceFollowOn);

module.exports = router;