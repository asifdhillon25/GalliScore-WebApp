const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { validate, commonValidators } = require('../middleware/validation.middleware');
const { auth, authorize, checkOwnership } = require('../middleware/auth.middleware');
const Match = require('../models/Match.model');

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/live', matchController.getLiveMatches);
router.get('/upcoming', matchController.getUpcomingMatches);
router.get('/share/:shareCode', matchController.getMatchByShareCode);
router.get('/:id', matchController.getMatchById);
router.get('/:id/stats', matchController.getMatchStatistics);

// Protected routes
router.use(auth);

// Match management
router.post(
  '/',
  authorize('scorer', 'team_manager', 'admin'),
  validate(commonValidators.createMatch),
  matchController.createMatch
);

router.put(
  '/:id',
  authorize('scorer', 'team_manager', 'admin'),
  checkOwnership(Match),
  matchController.updateMatch
);

router.delete(
  '/:id',
  authorize('admin'),
  checkOwnership(Match),
  matchController.deleteMatch
);

// Match actions
router.post('/:id/start', authorize('scorer', 'umpire'), matchController.startMatch);
router.post('/:id/toss', authorize('scorer', 'umpire'), matchController.recordToss);
router.post('/:id/end', authorize('scorer', 'umpire'), matchController.endMatch);
router.post('/:id/share', authorize('scorer'), matchController.generateShareLink);
router.post('/:id/inning', authorize('scorer'), matchController.addInning);

module.exports = router;