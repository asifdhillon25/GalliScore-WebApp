const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { validate, commonValidators } = require('../middleware/validation.middleware');
const { auth, authorize, checkOwnership } = require('../middleware/auth.middleware');
const Team = require('../models/Team.model');

// Public routes
router.get('/', teamController.getAllTeams);
router.get('/search', teamController.searchTeams);
router.get('/:id', teamController.getTeamById);
router.get('/:id/squad', teamController.getTeamSquad);
router.get('/:id/matches', teamController.getTeamMatches);
router.get('/:id/stats', teamController.getTeamStatistics);

// Protected routes
router.use(auth);

// Team management
router.post(
  '/',
  authorize('team_manager', 'admin'),
  validate(commonValidators.createTeam),
  teamController.createTeam
);

router.put(
  '/:id',
  authorize('team_manager', 'admin'),
  checkOwnership(Team),
  teamController.updateTeam
);

router.delete(
  '/:id',
  authorize('admin'),
  checkOwnership(Team),
  teamController.deleteTeam
);

// Squad management
router.put(
  '/:id/squad',
  authorize('team_manager', 'admin'),
  checkOwnership(Team),
  teamController.updateTeamSquad
);

module.exports = router;