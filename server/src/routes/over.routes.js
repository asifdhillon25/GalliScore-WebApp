const express = require('express');
const router = express.Router();
const overController = require('../controllers/over.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/inning/:inningId', overController.getInningOvers);
router.get('/:id', overController.getOverById);
router.get('/:id/summary', overController.getOverSummary);

// Protected routes
router.use(auth);

// Over management
router.put('/:id', authorize('scorer', 'admin'), overController.updateOver);
router.delete('/:id', authorize('scorer', 'admin'), overController.deleteOver);

// Statistics
router.get('/inning/:inningId/bowler/:bowlerId/spell', overController.getBowlerSpell);
router.get('/inning/:inningId/maidens', overController.getMaidenOvers);
router.get('/inning/:inningId/wickets', overController.getWicketOvers);
router.get('/inning/:inningId/expensive', overController.getExpensiveOvers);
router.get('/inning/:inningId/progression', overController.getOverByOverProgression);

module.exports = router;