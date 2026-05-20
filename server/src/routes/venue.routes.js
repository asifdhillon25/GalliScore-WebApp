const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venue.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { validate, commonValidators } = require('../middleware/validation.middleware');

// Public routes
router.get('/', venueController.getAllVenues);
router.get('/search/location', venueController.searchVenuesByLocation);
router.get('/pitch-type', venueController.getVenuesByPitchType);
router.get('/floodlit', venueController.getFloodlitVenues);
router.get('/tournament/:tournamentId', venueController.getVenuesForTournament);
router.get('/:id', venueController.getVenueById);
router.get('/:id/availability', venueController.getVenueAvailability);

// Protected routes (require authentication)
router.post('/', 
  auth,
  authorize('admin', 'team_manager'),
  validate(commonValidators.createVenue),
  venueController.createVenue
);

router.put('/:id',
  auth,
  authorize('admin', 'team_manager'),
  venueController.updateVenue
);

router.delete('/:id',
  auth,
  authorize('admin'),
  venueController.deleteVenue
);

router.post('/:id/images',
  auth,
  authorize('admin', 'team_manager'),
  // Add multer middleware here for file uploads
  venueController.uploadVenueImages
);

router.put('/:id/images/primary',
  auth,
  authorize('admin', 'team_manager'),
  venueController.setPrimaryImage
);

router.put('/:id/statistics',
  auth,
  authorize('admin', 'scorer'),
  venueController.updateVenueStatistics
);

module.exports = router;
