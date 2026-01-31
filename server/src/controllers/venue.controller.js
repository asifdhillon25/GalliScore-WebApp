const Venue = require('../models/Venue.model');
const Match = require('../models/Match.model');
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
        name: venueData.name 
      });

      if (existingVenue) {
        throw new ValidationError('Venue with this name already exists');
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
        country, 
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
      if (country) filter['address.country'] = { $regex: country, $options: 'i' };
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
        .select('name shortName address.city address.country type capacity facilities.floodlights facilities.scoreboard images')
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
        .populate('createdBy', 'username firstName lastName');

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      // Get recent matches at this venue
      const recentMatches = await Match.find({
        venue: id,
        status: 'completed'
      })
      .populate('team1', 'name shortName')
      .populate('team2', 'name shortName')
      .sort({ date: -1 })
      .limit(10);

      // Get venue statistics
      const totalMatches = await Match.countDocuments({ venue: id, status: 'completed' });
      
      // Calculate average scores
      const matches = await Match.find({ 
        venue: id, 
        status: 'completed' 
      }).populate('innings');

      let totalRuns = 0;
      let totalWickets = 0;
      let totalOvers = 0;
      let highestScore = 0;
      let lowestScore = Infinity;

      matches.forEach(match => {
        if (match.innings && match.innings.length > 0) {
          match.innings.forEach(inning => {
            totalRuns += inning.runs || 0;
            totalWickets += inning.wickets || 0;
            totalOvers += inning.overs || 0;
            
            if (inning.runs > highestScore) highestScore = inning.runs;
            if (inning.runs < lowestScore && inning.runs > 0) lowestScore = inning.runs;
          });
        }
      });

      const statistics = {
        totalMatches,
        averageScore: totalMatches > 0 ? totalRuns / (totalMatches * 2) : 0, // Assuming 2 innings per match
        averageWickets: totalMatches > 0 ? totalWickets / (totalMatches * 2) : 0,
        averageOvers: totalMatches > 0 ? totalOvers / (totalMatches * 2) : 0,
        highestScore: highestScore === 0 ? 'N/A' : highestScore,
        lowestScore: lowestScore === Infinity ? 'N/A' : lowestScore,
        totalRuns,
        totalWickets
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
      if (updateData.name) {
        const existingVenue = await Venue.findOne({
          name: updateData.name,
          _id: { $ne: id }
        });

        if (existingVenue) {
          throw new ValidationError('Venue with this name already exists');
        }
      }

      const venue = await Venue.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

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
      const { latitude, longitude, radius = 10 } = req.query;

      if (!latitude || !longitude) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const venues = await Venue.find({
        isActive: true,
        coordinates: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      })
      .select('name shortName address.city address.country coordinates type capacity')
      .limit(20);

      // Calculate distances
      const venuesWithDistance = venues.map(venue => {
        const distance = this.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          venue.coordinates.latitude,
          venue.coordinates.longitude
        );
        
        return {
          ...venue.toObject(),
          distance: distance.toFixed(1)
        };
      });

      // Sort by distance
      venuesWithDistance.sort((a, b) => a.distance - b.distance);

      res.status(200).json({
        success: true,
        data: { venues: venuesWithDistance }
      });
    } catch (error) {
      next(error);
    }
  },

  // Helper: Calculate distance between two coordinates
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  toRad: (value) => {
    return value * Math.PI / 180;
  },

  // Get venue availability
  getVenueAvailability: async (req, res, next) => {
    try {
      const