const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const { validate, commonValidators } = require('../middleware/validation.middleware');
const { auth, authorize, checkOwnership } = require('../middleware/auth.middleware');
const Player = require('../models/Player.model');

// Public routes
router.get('/', playerController.getAllPlayers);
router.get('/search', playerController.searchPlayers);
router.get('/:id', playerController.getPlayerById);
router.get('/:id/stats', playerController.getPlayerStats);
router.get('/:id/recent', playerController.getRecentPerformances);

// Protected routes - require authentication
router.use(auth);

// Player management
router.post(
  '/',
  authorize('scorer', 'team_manager', 'admin'),
  validate(commonValidators.createPlayer),
  playerController.createPlayer
);

router.put(
  '/:id',
  authorize('scorer', 'team_manager', 'admin'),
  checkOwnership(Player),
  playerController.updatePlayer
);

router.delete(
  '/:id',
  authorize('team_manager', 'admin'),
  checkOwnership(Player),
  playerController.deletePlayer
);

// Team management for players
router.post(
  '/:playerId/teams',
  authorize('team_manager', 'admin'),
  playerController.addPlayerToTeam
);

router.delete(
  '/:playerId/teams/:teamId',
  authorize('team_manager', 'admin'),
  playerController.removePlayerFromTeam
);

module.exports = router;