const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venue.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

// Public routes
router.get('/', venueController.getAllVenues);
router.get('/search/location', venueController.searchVenuesByLocation);
router.get('/pitch-type', venueController.getVenuesByPitchType);
router.get('/floodlit', venueController.getFloodlitVenues);
router.get('/:id', venueController.getVenueById);
router.get('/:id/availability', venueController.getVenueAvailability);
router.get('/tournament/:tournamentId', venueController.getVenuesForTournament);

// Protected routes (require authentication)
router.post('/', 
  authMiddleware.authenticate,
  authMiddleware.authorize('admin', 'organizer'),
  validationMiddleware.validateVenue,
  venueController.createVenue
);

router.put('/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin', 'organizer'),
  venueController.updateVenue
);

router.delete('/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin'),
  venueController.deleteVenue
);

router.post('/:id/images',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin', 'organizer'),
  // Add multer middleware here for file uploads
  venueController.uploadVenueImages
);

router.put('/:id/images/primary',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin', 'organizer'),
  venueController.setPrimaryImage
);

router.put('/:id/statistics',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin', 'scorer'),
  venueController.updateVenueStatistics
);

module.exports = router;