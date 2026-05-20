const Venue = require('../models/Venue.model');
const Match = require('../models/Match.model');
const Team = require('../models/Team.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const venueController = {
  // Create a new venue
  createVenue: async (req, res, next) => {
    try {
      const venueData = req.body;
      const userId = req.user._id;

      // Check if venue name already exists
      const existingVenue = await Venue.findOne({ 
        name: venueData.name,
        'address.city': venueData.address.city
      });

      if (existingVenue) {
        throw new ValidationError('Venue with this name already exists in this city');
      }

      // Create venue with coordinates if provided
      if (venueData.coordinates?.latitude !== undefined && venueData.coordinates?.longitude !== undefined) {
        venueData.coordinates = {
          type: 'Point',
          coordinates: [
            venueData.coordinates.longitude,
            venueData.coordinates.latitude
          ]
        };
      }

      // Create venue
      const venue = await Venue.create({
        ...venueData,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Venue created successfully',
        data: { venue }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all venues
  getAllVenues: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        city, 
        country = 'Pakistan', 
        type,
        hasFloodlights,
        hasPracticeNets,
        search,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;
      
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Build filter
      const filter = { isActive: true };
      
      if (city) filter['address.city'] = { $regex: city, $options: 'i' };
      if (country) filter['address.country'] = country;
      if (type) filter.type = type;
      if (hasFloodlights === 'true') filter['facilities.floodlights'] = true;
      if (hasPracticeNets === 'true') filter['facilities.practiceNets'] = true;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { shortName: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.state': { $regex: search, $options: 'i' } }
        ];
      }

      // Get venues
      const venues = await Venue.find(filter)
        .select('name shortName address.city address.country type capacity facilities.floodlights facilities.scoreboard images statistics.matchesPlayed')
        .populate('createdBy', 'username firstName lastName')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Venue.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          venues,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get venue by ID
  getVenueById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const venue = await Venue.findById(id)
        .populate('createdBy', 'username firstName lastName email')
        .populate('firstMatch.teams', 'name shortName logo');

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      // Get recent matches at this venue
      const recentMatches = await Match.find({
        venue: id,
        status: 'completed'
      })
      .select('title date format team1 team2 result statistics')
      .populate('team1', 'name shortName logo')
      .populate('team2', 'name shortName logo')
      .sort({ date: -1 })
      .limit(5);

      // Get venue statistics from model
      const statistics = {
        matchesPlayed: venue.statistics.matchesPlayed,
        totalRuns: venue.statistics.totalRuns,
        totalWickets: venue.statistics.totalWickets,
        averageScore: venue.statistics.averageScore,
        highestScore: venue.statistics.highestScore,
        lowestScore: venue.statistics.lowestScore,
        averageBoundary: venue.averageBoundary,
        pitchRating: venue.pitchRating
      };

      res.status(200).json({
        success: true,
        data: {
          venue,
          recentMatches,
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update venue
  updateVenue: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      // Check if name is being updated and if it already exists
      if (updateData.name || updateData.address?.city) {
        const existingVenue = await Venue.findOne({
          name: updateData.name || req.body.name,
          'address.city': updateData.address?.city || req.body.address?.city,
          _id: { $ne: id }
        });

        if (existingVenue) {
          throw new ValidationError('Venue with this name already exists in this city');
        }
      }

      const venue = await Venue.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      )
      .populate('createdBy', 'username firstName lastName');

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      res.status(200).json({
        success: true,
        message: 'Venue updated successfully',
        data: { venue }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete venue (soft delete)
  deleteVenue: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if venue has upcoming matches
      const upcomingMatches = await Match.countDocuments({
        venue: id,
        status: { $in: ['scheduled', 'toss', 'inning_1', 'inning_2', 'live'] }
      });

      if (upcomingMatches > 0) {
        throw new ValidationError(`Cannot delete venue with ${upcomingMatches} upcoming/scheduled matches`);
      }

      const venue = await Venue.findByIdAndUpdate(
        id,
        {
          isActive: false,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      res.status(200).json({
        success: true,
        message: 'Venue deactivated successfully',
        data: { venue }
      });
    } catch (error) {
      next(error);
    }
  },

  // Search venues by location
  searchVenuesByLocation: async (req, res, next) => {
    try {
      const { latitude, longitude, radius = 10, minCapacity, type } = req.query;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const maxDistance = parseFloat(radius) * 1000; // Convert km to meters

      // Build filter
      const filter = {
        isActive: true,
        coordinates: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat]
            },
            $maxDistance: maxDistance
          }
        }
      };

      if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };
      if (type) filter.type = type;

      const venues = await Venue.find(filter)
        .select('name shortName address city country coordinates type capacity facilities images statistics.matchesPlayed')
        .limit(50);

      // Calculate distances
      const venuesWithDistance = venues.map(venue => {
        const [venueLng, venueLat] = venue.coordinates.coordinates;
        const distance = venueController.calculateDistance(
          lat,
          lng,
          venueLat,
          venueLng
        );
        
        return {
          ...venue.toObject(),
          distance: distance.toFixed(1),
          averageBoundary: venue.averageBoundary,
          pitchRating: venue.pitchRating
        };
      });

      // Sort by distance
      venuesWithDistance.sort((a, b) => a.distance - b.distance);

      res.status(200).json({
        success: true,
        data: { 
          venues: venuesWithDistance,
          center: { latitude: lat, longitude: lng },
          radius: radius
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get venue availability
  getVenueAvailability: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new ValidationError('Start date and end date are required');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range
      if (start > end) {
        throw new ValidationError('Start date must be before end date');
      }

      if ((end - start) / (1000 * 60 * 60 * 24) > 90) {
        throw new ValidationError('Date range cannot exceed 90 days');
      }

      // Find all matches scheduled at this venue in the given date range
      const scheduledMatches = await Match.find({
        venue: id,
        status: { $in: ['scheduled', 'toss', 'inning_1', 'inning_2', 'live'] },
        $or: [
          { date: { $gte: start, $lte: end } },
          { 
            startTime: { $lte: end },
            endTime: { $gte: start }
          }
        ]
      })
      .select('title date startTime endTime format status team1 team2 tournament')
      .populate('team1', 'name shortName')
      .populate('team2', 'name shortName')
      .populate('tournament', 'name')
      .sort({ date: 1, startTime: 1 });

      // Get venue details
      const venue = await Venue.findById(id).select('name address capacity pitches.total facilities booking.available booking.rate');
      
      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      // Check if venue is available for booking
      if (!venue.booking.available) {
        return res.status(200).json({
          success: true,
          data: {
            venue: {
              name: venue.name,
              bookingAvailable: false,
              message: 'This venue does not accept bookings'
            },
            availability: []
          }
        });
      }

      // Generate availability calendar
      const availability = venueController.generateAvailabilityCalendar(
        start,
        end,
        scheduledMatches,
        venue.pitches.total
      );

      res.status(200).json({
        success: true,
        data: {
          venue: {
            name: venue.name,
            address: venue.fullAddress,
            capacity: venue.capacity,
            pitches: venue.pitches.total,
            bookingRates: venue.booking.rate,
            facilities: venue.facilities
          },
          availability,
          scheduledMatches: scheduledMatches.map(match => ({
            id: match._id,
            title: match.title,
            date: match.date,
            startTime: match.startTime,
            endTime: match.endTime,
            format: match.format,
            teams: [match.team1, match.team2],
            tournament: match.tournament?.name,
            status: match.status
          })),
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get venues by pitch type
  getVenuesByPitchType: async (req, res, next) => {
    try {
      const { surface, condition, minRating } = req.query;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const filter = { isActive: true };
      
      if (surface) filter['pitches.surface'] = surface;
      if (condition) filter['pitches.condition'] = condition;
      
      // Filter by minimum pitch rating
      if (minRating) {
        filter.$or = [
          { 'pitchBehavior.pace': { $gte: parseInt(minRating) } },
          { 'pitchBehavior.bounce': { $gte: parseInt(minRating) } },
          { 'pitchBehavior.turn': { $gte: parseInt(minRating) } },
          { 'pitchBehavior.seam': { $gte: parseInt(minRating) } }
        ];
      }

      const venues = await Venue.find(filter)
        .select('name address.city pitches.surface pitches.condition pitchBehavior images statistics.matchesPlayed')
        .sort({ 'statistics.matchesPlayed': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Calculate pitch ratings for each venue
      const venuesWithRatings = venues.map(venue => ({
        ...venue.toObject(),
        pitchRating: venue.pitchRating,
        averageScore: venue.statistics.averageScore,
        matchesPlayed: venue.statistics.matchesPlayed
      }));

      const total = await Venue.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          venues: venuesWithRatings,
          filters: { surface, condition, minRating },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update venue statistics after match
  updateVenueStatistics: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { runs, wickets, isHighestScore = false } = req.body;

      const venue = await Venue.findById(id);
      
      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      // Update statistics using model method
      await venue.updateStatistics(runs, wickets);
      
      // Update highest score if applicable
      if (isHighestScore && runs > venue.statistics.highestScore) {
        venue.statistics.highestScore = runs;
      }

      // Update lowest score if applicable
      if (runs > 0 && runs < venue.statistics.lowestScore) {
        venue.statistics.lowestScore = runs;
      } else if (venue.statistics.lowestScore === 0) {
        venue.statistics.lowestScore = runs;
      }

      await venue.save();

      res.status(200).json({
        success: true,
        message: 'Venue statistics updated successfully',
        data: { statistics: venue.statistics }
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload venue images
  uploadVenueImages: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { files } = req;
      const { captions = [] } = req.body;

      if (!files || files.length === 0) {
        throw new ValidationError('No images uploaded');
      }

      const venue = await Venue.findById(id);
      
      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      // Add new images
      const newImages = files.map((file, index) => ({
        url: file.path, // Assuming multer saves file path
        caption: captions[index] || '',
        isPrimary: venue.images.length === 0 && index === 0 // First image is primary
      }));

      venue.images.push(...newImages);
      await venue.save();

      res.status(200).json({
        success: true,
        message: `${files.length} images uploaded successfully`,
        data: { images: venue.images }
      });
    } catch (error) {
      next(error);
    }
  },

  // Set primary image
  setPrimaryImage: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const venue = await Venue.findById(id);
      
      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      await venue.setPrimaryImage(imageUrl);

      res.status(200).json({
        success: true,
        message: 'Primary image updated successfully',
        data: { images: venue.images }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get venues with floodlights
  getFloodlitVenues: async (req, res, next) => {
    try {
      const { city, minCapacity } = req.query;

      const filter = {
        isActive: true,
        'facilities.floodlights': true
      };

      if (city) filter['address.city'] = { $regex: city, $options: 'i' };
      if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

      const venues = await Venue.find(filter)
        .select('name address.city capacity facilities.floodlights facilities.scoreboard images')
        .sort({ capacity: -1 });

      res.status(200).json({
        success: true,
        data: {
          venues,
          total: venues.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get venues for tournament
  getVenuesForTournament: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { hasFloodlights, minCapacity } = req.query;

      // Get tournament matches to find venues
      const matches = await Match.find({ 
        tournament: tournamentId,
        venue: { $ne: null }
      })
      .distinct('venue');

      const filter = {
        _id: { $in: matches },
        isActive: true
      };

      if (hasFloodlights === 'true') filter['facilities.floodlights'] = true;
      if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

      const venues = await Venue.find(filter)
        .select('name address.city capacity facilities images statistics.matchesPlayed')
        .populate('createdBy', 'username')
        .sort({ 'statistics.matchesPlayed': -1 });

      res.status(200).json({
        success: true,
        data: { venues }
      });
    } catch (error) {
      next(error);
    }
  },

  // Helper: Calculate distance between two coordinates (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Helper: Generate availability calendar
  generateAvailabilityCalendar: (startDate, endDate, scheduledMatches, totalPitches) => {
    const availability = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayMatches = scheduledMatches.filter(match => {
        const matchDate = new Date(match.date).toISOString().split('T')[0];
        return matchDate === dateStr;
      });

      // Calculate available pitches
      const bookedPitches = Math.min(dayMatches.length, totalPitches);
      const availablePitches = totalPitches - bookedPitches;

      availability.push({
        date: dateStr,
        day: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        totalPitches,
        bookedPitches,
        availablePitches,
        isAvailable: availablePitches > 0,
        matches: dayMatches.map(match => ({
          id: match._id,
          title: match.title,
          startTime: match.startTime,
          endTime: match.endTime,
          format: match.format
        }))
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return availability;
  }
};

module.exports = venueController;
