const express = require('express');
const router = express.Router();
const ScoringController = require('../controllers/scoring.controller');
const { validate, commonValidators } = require('../middleware/validation.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');

// Protected routes - scoring requires authentication
router.use(auth);

// Inning management
router.post('/inning/initialize', authorize('scorer'), ScoringController.initializeInning);
router.post('/inning/:inningId/start', authorize('scorer'), ScoringController.startInning);

// Ball scoring
router.post(
  '/inning/:inningId/ball',
  authorize('scorer'),
  validate(commonValidators.scoreBall),
  ScoringController.scoreBall
);

router.post('/inning/:inningId/undo', authorize('scorer'), ScoringController.undoBall);

// Player updates during match
router.put('/inning/:inningId/batsmen', authorize('scorer'), ScoringController.updateBatsmen);
router.put('/inning/:inningId/bowler', authorize('scorer'), ScoringController.updateBowler);

// Match state
router.get('/match/:matchId/state', authorize('scorer', 'umpire', 'team_manager'), ScoringController.getScoringState);
router.get('/match/:matchId/commentary', ScoringController.getBallByBall);

module.exports = router;