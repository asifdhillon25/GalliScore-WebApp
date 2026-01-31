const Team = require('../models/Team.model');
const Player = require('../models/Player.model');
const Match = require('../models/Match.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const teamController = {
  // Create a new team
  createTeam: async (req, res, next) => {
    try {
      const teamData = req.body;
      const userId = req.user._id;

      // Check if team name already exists
      const existingTeam = await Team.findOne({ 
        name: teamData.name 
      });

      if (existingTeam) {
        throw new ValidationError('Team with this name already exists');
      }

      // Create team
      const team = await Team.create({
        ...teamData,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all teams with filtering
  getAllTeams: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        type, 
        city, 
        country, 
        isActive 
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { shortName: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (type) filter.type = type;
      if (city) filter.city = city;
      if (country) filter.country = country;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      // Get teams with population
      const teams = await Team.find(filter)
        .populate({
          path: 'players.player',
          select: 'displayName firstName lastName jerseyNumber primaryRole'
        })
        .populate('captain', 'displayName firstName lastName')
        .populate('viceCaptain', 'displayName firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Team.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          teams,
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

  // Get team by ID
  getTeamById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const team = await Team.findById(id)
        .populate({
          path: 'players.player',
          select: 'displayName firstName lastName jerseyNumber primaryRole battingStyle bowlingStyle profileImage'
        })
        .populate('captain', 'displayName firstName lastName jerseyNumber')
        .populate('viceCaptain', 'displayName firstName lastName jerseyNumber')
        .populate('manager', 'username firstName lastName profileImage')
        .populate('homeGround', 'name city')
        .populate('createdBy', 'username firstName lastName');

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Get team statistics from matches
      const matches = await Match.find({
        $or: [
          { team1: id },
          { team2: id }
        ],
        status: 'completed'
      });

      const teamStats = {
        totalMatches: matches.length,
        wins: matches.filter(m => 
          (m.result === 'team1_win' && m.team1.toString() === id) ||
          (m.result === 'team2_win' && m.team2.toString() === id)
        ).length,
        losses: matches.filter(m => 
          (m.result === 'team1_win' && m.team2.toString() === id) ||
          (m.result === 'team2_win' && m.team1.toString() === id)
        ).length,
        draws: matches.filter(m => m.result === 'draw').length,
        ties: matches.filter(m => m.result === 'tie').length
      };

      res.status(200).json({
        success: true,
        data: {
          team,
          statistics: teamStats
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update team
  updateTeam: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      // Check if name is being updated and if it already exists
      if (updateData.name) {
        const existingTeam = await Team.findOne({
          name: updateData.name,
          _id: { $ne: id }
        });

        if (existingTeam) {
          throw new ValidationError('Team with this name already exists');
        }
      }

      const team = await Team.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      res.status(200).json({
        success: true,
        message: 'Team updated successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete team (soft delete)
  deleteTeam: async (req, res, next) => {
    try {
      const { id } = req.params;

      const team = await Team.findByIdAndUpdate(
        id,
        {
          isActive: false,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      res.status(200).json({
        success: true,
        message: 'Team deactivated successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get team squad
  getTeamSquad: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { activeOnly = 'true' } = req.query;

      const team = await Team.findById(id)
        .populate({
          path: 'players.player',
          select: 'displayName firstName lastName jerseyNumber primaryRole battingStyle bowlingStyle dateOfBirth profileImage'
        });

      if (!team) {
        throw new NotFoundError('Team not found');
      }

      let squad = team.players;
      
      if (activeOnly === 'true') {
        squad = squad.filter(player => player.isActive);
      }

      // Categorize players by role
      const categorizedSquad = {
        captain: squad.find(p => p.role === 'captain'),
        viceCaptain: squad.find(p => p.role === 'vice-captain'),
        wicketKeepers: squad.filter(p => {
          const player = p.player;
          return player && player.primaryRole === 'wicket-keeper';
        }),
        batsmen: squad.filter(p => {
          const player = p.player;
          return player && (player.primaryRole === 'batsman' || player.primaryRole === 'all-rounder');
        }),
        bowlers: squad.filter(p => {
          const player = p.player;
          return player && (player.primaryRole === 'bowler' || player.primaryRole === 'all-rounder');
        })
      };

      res.status(200).json({
        success: true,
        data: {
          team: {
            name: team.name,
            shortName: team.shortName,
            logo: team.logo
          },
          squad: categorizedSquad
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update team squad
  updateTeamSquad: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { squadUpdates } = req.body;

      const team = await Team.findById(id);
      
      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Apply squad updates
      squadUpdates.forEach(update => {
        const playerIndex = team.players.findIndex(
          p => p.player.toString() === update.playerId
        );

        if (playerIndex !== -1) {
          if (update.action === 'update') {
            // Update player details
            if (update.jerseyNumber !== undefined) {
              team.players[playerIndex].jerseyNumber = update.jerseyNumber;
            }
            if (update.role) {
              team.players[playerIndex].role = update.role;
            }
            if (update.isActive !== undefined) {
              team.players[playerIndex].isActive = update.isActive;
            }
          } else if (update.action === 'remove') {
            // Remove player from squad
            team.players.splice(playerIndex, 1);
          }
        } else if (update.action === 'add') {
          // Add new player to squad
          team.players.push({
            player: update.playerId,
            jerseyNumber: update.jerseyNumber,
            role: update.role || 'player',
            joinedDate: new Date(),
            isActive: true
          });
        }
      });

      // Update captain and vice-captain if specified
      if (req.body.captain) {
        team.captain = req.body.captain;
      }
      if (req.body.viceCaptain) {
        team.viceCaptain = req.body.viceCaptain;
      }

      await team.save();

      res.status(200).json({
        success: true,
        message: 'Team squad updated successfully',
        data: { team }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get team matches
  getTeamMatches: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        status, 
        format, 
        season 
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build match filter
      const matchFilter = {
        $or: [
          { team1: id },
          { team2: id }
        ]
      };

      if (status) matchFilter.status = status;
      if (format) matchFilter.format = format;
      if (season) matchFilter.season = season;

      // Get matches
      const matches = await Match.find(matchFilter)
        .populate('team1', 'name shortName logo')
        .populate('team2', 'name shortName logo')
        .populate('venue', 'name city')
        .populate('tournament', 'name season')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Match.countDocuments(matchFilter);

      res.status(200).json({
        success: true,
        data: {
          matches,
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

  // Get team statistics
  getTeamStatistics: async (req, res, next) => {
    try {
      const { id } = req.params;

      const team = await Team.findById(id);
      
      if (!team) {
        throw new NotFoundError('Team not found');
      }

      // Get all matches for this team
      const matches = await Match.find({
        $or: [
          { team1: id },
          { team2: id }
        ],
        status: 'completed'
      })
      .populate('innings')
      .populate('team1', 'name shortName')
      .populate('team2', 'name shortName');

      // Calculate statistics
      let totalMatches = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalDraws = 0;
      let totalTies = 0;
      let totalRunsScored = 0;
      let totalRunsConceded = 0;
      let totalWicketsTaken = 0;
      let totalWicketsLost = 0;
      let highestScore = 0;
      let lowestScore = Infinity;

      matches.forEach(match => {
        totalMatches++;
        
        // Determine if team is team1 or team2
        const isTeam1 = match.team1._id.toString() === id;
        const opponent = isTeam1 ? match.team2 : match.team1;

        // Get match result for this team
        if (match.result === 'draw') {
          totalDraws++;
        } else if (match.result === 'tie') {
          totalTies++;
        } else if (
          (match.result === 'team1_win' && isTeam1) ||
          (match.result === 'team2_win' && !isTeam1)
        ) {
          totalWins++;
        } else {
          totalLosses++;
        }

        // Get innings data if available
        if (match.innings && match.innings.length > 0) {
          match.innings.forEach(inning => {
            if (inning.battingTeam.toString() === id) {
              totalRunsScored += inning.runs || 0;
              totalWicketsLost += inning.wickets || 0;
              
              if (inning.runs > highestScore) {
                highestScore = inning.runs;
              }
              if (inning.runs < lowestScore) {
                lowestScore = inning.runs;
              }
            }
            if (inning.bowlingTeam.toString() === id) {
              totalRunsConceded += inning.runs || 0;
              totalWicketsTaken += inning.wickets || 0;
            }
          });
        }
      });

      if (lowestScore === Infinity) lowestScore = 0;

      const statistics = {
        overview: {
          totalMatches,
          wins: totalWins,
          losses: totalLosses,
          draws: totalDraws,
          ties: totalTies,
          winPercentage: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0
        },
        batting: {
          totalRuns: totalRunsScored,
          averageScore: totalMatches > 0 ? totalRunsScored / totalMatches : 0,
          highestScore,
          lowestScore: lowestScore === Infinity ? 0 : lowestScore,
          totalWicketsLost
        },
        bowling: {
          totalRunsConceded,
          totalWicketsTaken,
          averageRunsConceded: totalMatches > 0 ? totalRunsConceded / totalMatches : 0,
          averageWicketsPerMatch: totalMatches > 0 ? totalWicketsTaken / totalMatches : 0
        }
      };

      res.status(200).json({
        success: true,
        data: {
          team: {
            name: team.name,
            shortName: team.shortName,
            logo: team.logo
          },
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Search teams
  searchTeams: async (req, res, next) => {
    try {
      const { query } = req.query;

      if (!query || query.length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }

      const teams = await Team.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { shortName: { $regex: query, $options: 'i' } },
          { city: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      })
      .select('name shortName logo city country type')
      .limit(20);

      res.status(200).json({
        success: true,
        data: { teams }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teamController;