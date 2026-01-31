const Player = require('../models/Player.model');
const Team = require('../models/Team.model');
const BattingStats = require('../models/BattingStats.model');
const BowlingStats = require('../models/BowlingStats.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const playerController = {
  // Create a new player
  createPlayer: async (req, res, next) => {
    try {
      const playerData = req.body;
      const userId = req.user._id;

      // Check if display name already exists
      const existingPlayer = await Player.findOne({ 
        displayName: playerData.displayName 
      });

      if (existingPlayer) {
        throw new ValidationError('Player with this display name already exists');
      }

      // Create player
      const player = await Player.create({
        ...playerData,
        createdBy: userId,
        lastUpdatedBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Player created successfully',
        data: { player }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all players with filtering and pagination
  getAllPlayers: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, battingStyle, bowlingStyle, role, isActive } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (battingStyle) filter.battingStyle = battingStyle;
      if (bowlingStyle) filter.bowlingStyle = bowlingStyle;
      if (role) filter.primaryRole = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      // Get players with population
      const players = await Player.find(filter)
        .populate('currentTeams', 'name shortName')
        .sort({ 'careerStats.batting.runs': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Player.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          players,
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

  // Get player by ID
  getPlayerById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const player = await Player.findById(id)
        .populate('currentTeams', 'name shortName logo')
        .populate('createdBy', 'username firstName lastName');

      if (!player) {
        throw new NotFoundError('Player not found');
      }

      res.status(200).json({
        success: true,
        data: { player }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update player
  updatePlayer: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      // Check if display name is being updated and if it already exists
      if (updateData.displayName) {
        const existingPlayer = await Player.findOne({
          displayName: updateData.displayName,
          _id: { $ne: id }
        });

        if (existingPlayer) {
          throw new ValidationError('Player with this display name already exists');
        }
      }

      const player = await Player.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!player) {
        throw new NotFoundError('Player not found');
      }

      res.status(200).json({
        success: true,
        message: 'Player updated successfully',
        data: { player }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete player (soft delete)
  deletePlayer: async (req, res, next) => {
    try {
      const { id } = req.params;

      const player = await Player.findByIdAndUpdate(
        id,
        {
          isActive: false,
          retiredDate: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!player) {
        throw new NotFoundError('Player not found');
      }

      res.status(200).json({
        success: true,
        message: 'Player deactivated successfully',
        data: { player }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get player statistics
  getPlayerStats: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { format, season, tournament } = req.query;

      const player = await Player.findById(id);
      
      if (!player) {
        throw new NotFoundError('Player not found');
      }

      // Build match filter for stats
      const matchFilter = {};
      if (format) matchFilter.format = format;
      if (season) matchFilter.season = season;
      if (tournament) matchFilter.tournament = tournament;

      // Get batting stats
      const battingStats = await BattingStats.aggregate([
        {
          $match: {
            player: player._id,
            ...(Object.keys(matchFilter).length > 0 && {
              'matchDetails.format': format,
              'matchDetails.season': season,
              'matchDetails.tournament': tournament
            })
          }
        },
        {
          $group: {
            _id: null,
            matches: { $sum: 1 },
            innings: { $sum: 1 },
            runs: { $sum: '$runs' },
            ballsFaced: { $sum: '$ballsFaced' },
            highestScore: { $max: '$runs' },
            centuries: {
              $sum: {
                $cond: [{ $gte: ['$runs', 100] }, 1, 0]
              }
            },
            halfCenturies: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$runs', 50] }, { $lt: ['$runs', 100] }] },
                  1, 0
                ]
              }
            },
            fours: { $sum: '$fours' },
            sixes: { $sum: '$sixes' },
            notOuts: {
              $sum: {
                $cond: [{ $eq: ['$isNotOut', true] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            matches: 1,
            innings: 1,
            runs: 1,
            ballsFaced: 1,
            highestScore: 1,
            centuries: 1,
            halfCenturies: 1,
            fours: 1,
            sixes: 1,
            notOuts: 1,
            average: {
              $cond: [
                { $gt: [{ $subtract: ['$innings', '$notOuts'] }, 0] },
                { $divide: ['$runs', { $subtract: ['$innings', '$notOuts'] }] },
                0
              ]
            },
            strikeRate: {
              $cond: [
                { $gt: ['$ballsFaced', 0] },
                { $multiply: [{ $divide: ['$runs', '$ballsFaced'] }, 100] },
                0
              ]
            },
            boundaryRuns: {
              $add: [
                { $multiply: ['$fours', 4] },
                { $multiply: ['$sixes', 6] }
              ]
            },
            boundaryPercentage: {
              $cond: [
                { $gt: ['$runs', 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $add: [
                          { $multiply: ['$fours', 4] },
                          { $multiply: ['$sixes', 6] }
                        ]},
                        '$runs'
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        }
      ]);

      // Get bowling stats
      const bowlingStats = await BowlingStats.aggregate([
        {
          $match: {
            player: player._id,
            ...(Object.keys(matchFilter).length > 0 && {
              'matchDetails.format': format,
              'matchDetails.season': season,
              'matchDetails.tournament': tournament
            })
          }
        },
        {
          $group: {
            _id: null,
            matches: { $sum: 1 },
            innings: { $sum: 1 },
            overs: { $sum: '$overs' },
            balls: { $sum: '$balls' },
            runs: { $sum: '$runs' },
            wickets: { $sum: '$wickets' },
            maidens: { $sum: '$maidens' },
            extras: { $sum: '$extras.total' },
            bestBowlingWickets: { $max: '$wickets' }
          }
        },
        {
          $project: {
            _id: 0,
            matches: 1,
            innings: 1,
            overs: 1,
            balls: 1,
            runs: 1,
            wickets: 1,
            maidens: 1,
            extras: 1,
            totalBalls: { $add: [{ $multiply: ['$overs', 6] }, '$balls'] },
            economy: {
              $cond: [
                { $gt: ['$overs', 0] },
                { $divide: ['$runs', '$overs'] },
                0
              ]
            },
            average: {
              $cond: [
                { $gt: ['$wickets', 0] },
                { $divide: ['$runs', '$wickets'] },
                0
              ]
            },
            strikeRate: {
              $cond: [
                { $gt: ['$wickets', 0] },
                {
                  $divide: [
                    { $add: [{ $multiply: ['$overs', 6] }, '$balls'] },
                    '$wickets'
                  ]
                },
                0
              ]
            },
            bestBowling: '$bestBowlingWickets'
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          player,
          batting: battingStats[0] || {},
          bowling: bowlingStats[0] || {}
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get player's recent performances
  getRecentPerformances: async (req, res, next) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const battingPerformances = await BattingStats.find({ player: id })
        .populate('match', 'title date format result')
        .populate('inning', 'inningNumber')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('runs ballsFaced fours sixes isNotOut dismissal strikeRate createdAt');

      const bowlingPerformances = await BowlingStats.find({ player: id })
        .populate('match', 'title date format result')
        .populate('inning', 'inningNumber')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('overs balls runs wickets maidens economy strikeRate createdAt');

      res.status(200).json({
        success: true,
        data: {
          batting: battingPerformances,
          bowling: bowlingPerformances
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Search players by name
  searchPlayers: async (req, res, next) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }

      const players = await Player.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      })
      .select('firstName lastName displayName jerseyNumber primaryRole profileImage')
      .limit(20);

      res.status(200).json({
        success: true,
        data: { players }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add player to team
  addPlayerToTeam: async (req, res, next) => {
    try {
      const { playerId } = req.params;
      const { teamId, jerseyNumber, role } = req.body;

      const [player, team] = await Promise.all([
        Player.findById(playerId),
        Team.findById(teamId)
      ]);

      if (!player) throw new NotFoundError('Player not found');
      if (!team) throw new NotFoundError('Team not found');

      // Check if player is already in team
      const existingPlayerInTeam = team.players.find(
        p => p.player.toString() === playerId
      );

      if (existingPlayerInTeam) {
        throw new ValidationError('Player is already in this team');
      }

      // Add player to team
      await team.addPlayer(playerId, jerseyNumber, role || 'player');

      // Add team to player's current teams
      if (!player.currentTeams.includes(teamId)) {
        player.currentTeams.push(teamId);
        await player.save();
      }

      res.status(200).json({
        success: true,
        message: 'Player added to team successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove player from team
  removePlayerFromTeam: async (req, res, next) => {
    try {
      const { playerId, teamId } = req.params;

      const [player, team] = await Promise.all([
        Player.findById(playerId),
        Team.findById(teamId)
      ]);

      if (!player) throw new NotFoundError('Player not found');
      if (!team) throw new NotFoundError('Team not found');

      // Remove player from team
      await team.removePlayer(playerId);

      // Remove team from player's current teams
      player.currentTeams = player.currentTeams.filter(
        team => team.toString() !== teamId
      );
      await player.save();

      res.status(200).json({
        success: true,
        message: 'Player removed from team successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = playerController;