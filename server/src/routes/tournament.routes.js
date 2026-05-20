const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Protected routes
router.use(auth);

// Tournament discovery and access
router.get('/', tournamentController.getAllTournaments);
router.post('/join/:inviteCode', tournamentController.joinTournament);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/stats', tournamentController.getTournamentStats);

// Tournament management
router.post(
  '/',
  authorize('admin', 'team_manager'),
  tournamentController.createTournament
);

router.put(
  '/:id',
  authorize('admin', 'team_manager'),
  tournamentController.updateTournament
);

router.delete(
  '/:id',
  authorize('admin', 'team_manager'),
  tournamentController.deleteTournament
);

// Teams and scheduling
router.post(
  '/:id/teams',
  authorize('admin', 'team_manager'),
  tournamentController.addTeamToTournament
);

router.delete(
  '/:id/teams/:teamId',
  authorize('admin', 'team_manager'),
  tournamentController.removeTeamFromTournament
);

router.post(
  '/:id/schedule',
  authorize('admin', 'team_manager'),
  tournamentController.generateSchedule
);

router.put(
  '/:id/standings',
  authorize('admin', 'team_manager', 'scorer'),
  tournamentController.updateStandings
);

router.post(
  '/:id/invite-code',
  authorize('admin', 'team_manager'),
  tournamentController.generateInviteCode
);

module.exports = router;
