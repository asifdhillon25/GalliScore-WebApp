const Match = require('../models/Match.model');
const Team = require('../models/Team.model');
const Inning = require('../models/Inning.model');
const Player = require('../models/Player.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const matchController = {
  // Create a new match
  createMatch: async (req, res, next) => {
    try {
      const matchData = req.body;
      const userId = req.user._id;

      // Validate teams exist
      const [team1, team2] = await Promise.all([
        Team.findById(matchData.team1),
        Team.findById(matchData.team2)
      ]);

      if (!team1 || !team2) {
        throw new ValidationError('One or both teams not found');
      }

      // Validate teams are different
      if (team1._id.toString() === team2._id.toString()) {
        throw new ValidationError('Teams must be different');
      }

      // Create match
      const match = await Match.create({
        ...matchData,
        createdBy: userId,
        status: 'scheduled'
      });

      res.status(201).json({
        success: true,
        message: 'Match created successfully',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all matches with filtering
  getAllMatches: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        format, 
        team, 
        tournament,
        dateFrom,
        dateTo,
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;
      
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Build filter
      const filter = {};
      
      if (status) filter.status = status;
      if (format) filter.format = format;
      if (tournament) filter.tournament = tournament;
      
      if (team) {
        filter.$or = [
          { team1: team },
          { team2: team }
        ];
      }
      
      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
      }

      // Get matches with population
      const matches = await Match.find(filter)
        .populate('team1', 'name shortName logo')
        .populate('team2', 'name shortName logo')
        .populate('venue', 'name city')
        .populate('tournament', 'name season')
        .populate('innings')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Match.countDocuments(filter);

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

  // Get match by ID
  getMatchById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const match = await Match.findById(id)
        .populate('team1', 'name shortName logo city')
        .populate('team2', 'name shortName logo city')
        .populate('venue', 'name city address coordinates facilities')
        .populate('tournament', 'name season type')
        .populate('umpires')
        .populate('scorers.user', 'username firstName lastName')
        .populate('toss.wonBy', 'name shortName')
        .populate('awards.manOfTheMatch', 'displayName firstName lastName')
        .populate('awards.bestBatsman', 'displayName firstName lastName')
        .populate('awards.bestBowler', 'displayName firstName lastName')
        .populate('innings')
        .populate('createdBy', 'username firstName lastName');

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Get detailed inning data if match has innings
      let detailedInnings = [];
      if (match.innings && match.innings.length > 0) {
        detailedInnings = await Promise.all(
          match.innings.map(async (inning) => {
            const inningDetails = await Inning.findById(inning._id)
              .populate('battingTeam', 'name shortName')
              .populate('bowlingTeam', 'name shortName')
              .populate('currentBatsmen.striker', 'displayName firstName lastName')
              .populate('currentBatsmen.nonStriker', 'displayName firstName lastName')
              .populate('currentBowler', 'displayName firstName lastName')
              .populate('fallOfWickets.batsman', 'displayName firstName lastName')
              .populate('playingXI.batting.player', 'displayName firstName lastName')
              .populate('playingXI.bowling.player', 'displayName firstName lastName');
            return inningDetails;
          })
        );
      }

      res.status(200).json({
        success: true,
        data: {
          match: {
            ...match.toObject(),
            innings: detailedInnings
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update match
  updateMatch: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const match = await Match.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      res.status(200).json({
        success: true,
        message: 'Match updated successfully',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete match
  deleteMatch: async (req, res, next) => {
    try {
      const { id } = req.params;

      const match = await Match.findByIdAndDelete(id);

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Also delete associated innings
      await Inning.deleteMany({ matchId: id });

      res.status(200).json({
        success: true,
        message: 'Match deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Start match (change status from scheduled to toss)
  startMatch: async (req, res, next) => {
    try {
      const { id } = req.params;

      const match = await Match.findById(id);
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      if (match.status !== 'scheduled') {
        throw new ValidationError('Match can only be started from scheduled status');
      }

      match.status = 'toss';
      match.startTime = new Date();
      await match.save();

      res.status(200).json({
        success: true,
        message: 'Match started. Proceed to toss.',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // Record toss
  recordToss: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { wonBy, decision, electedTo } = req.body;

      const match = await Match.findById(id);
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      if (match.status !== 'toss') {
        throw new ValidationError('Toss can only be recorded when match status is "toss"');
      }

      match.toss = {
        wonBy,
        decision,
        electedTo: electedTo || (decision === 'bat' ? 'bat' : 'field')
      };
      
      match.status = 'inning_1';
      await match.save();

      res.status(200).json({
        success: true,
        message: 'Toss recorded successfully',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // End match
  endMatch: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { result, resultDescription } = req.body;

      const match = await Match.findById(id);
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Validate result
      const validResults = ['team1_win', 'team2_win', 'draw', 'tie', 'no_result', 'abandoned'];
      if (!validResults.includes(result)) {
        throw new ValidationError('Invalid match result');
      }

      match.status = 'completed';
      match.result = result;
      match.resultDescription = resultDescription || '';
      match.endTime = new Date();
      
      // Update team stats based on result
      if (result === 'team1_win') {
        match.points = { team1: 2, team2: 0 };
      } else if (result === 'team2_win') {
        match.points = { team1: 0, team2: 2 };
      } else if (result === 'draw' || result === 'tie' || result === 'no_result') {
        match.points = { team1: 1, team2: 1 };
      }

      await match.save();

      res.status(200).json({
        success: true,
        message: 'Match ended successfully',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get live matches
  getLiveMatches: async (req, res, next) => {
    try {
      const liveStatuses = ['live', 'inning_1', 'inning_2', 'inning_3', 'inning_4', 'super_over'];

      const matches = await Match.find({
        status: { $in: liveStatuses }
      })
      .populate('team1', 'name shortName logo')
      .populate('team2', 'name shortName logo')
      .populate('venue', 'name city')
      .populate('innings')
      .sort({ startTime: -1 })
      .limit(20);

      // Add live score details
      const liveMatches = await Promise.all(
        matches.map(async (match) => {
          const matchObj = match.toObject();
          
          if (match.innings && match.innings.length > 0) {
            const latestInning = await Inning.findById(match.innings[match.innings.length - 1])
              .select('runs wickets overs balls currentBatsmen currentBowler')
              .populate('currentBatsmen.striker', 'displayName')
              .populate('currentBatsmen.nonStriker', 'displayName')
              .populate('currentBowler', 'displayName');
            
            matchObj.liveScore = latestInning;
          }
          
          return matchObj;
        })
      );

      res.status(200).json({
        success: true,
        data: {
          matches: liveMatches,
          count: liveMatches.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get upcoming matches
  getUpcomingMatches: async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;

      const matches = await Match.find({
        status: 'scheduled',
        date: { $gte: new Date() }
      })
      .populate('team1', 'name shortName logo')
      .populate('team2', 'name shortName logo')
      .populate('venue', 'name city')
      .populate('tournament', 'name')
      .sort({ date: 1 })
      .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        data: { matches }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get match statistics
  getMatchStatistics: async (req, res, next) => {
    try {
      const { id } = req.params;

      const match = await Match.findById(id)
        .populate('innings')
        .populate('team1', 'name shortName')
        .populate('team2', 'name shortName');

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Get detailed statistics from innings
      const statistics = {
        team1: { runs: 0, wickets: 0, extras: 0, overs: 0 },
        team2: { runs: 0, wickets: 0, extras: 0, overs: 0 },
        partnerships: [],
        fallOfWickets: [],
        bestPerformances: {
          batting: [],
          bowling: []
        }
      };

      // Process innings data
      if (match.innings && match.innings.length > 0) {
        for (const inning of match.innings) {
          const inningDetails = await Inning.findById(inning._id)
            .populate('fallOfWickets.batsman', 'displayName')
            .populate('partnerships.batsman1', 'displayName')
            .populate('partnerships.batsman2', 'displayName');

          if (inningDetails) {
            const teamKey = inningDetails.battingTeam.toString() === match.team1._id.toString() 
              ? 'team1' 
              : 'team2';
            
            statistics[teamKey].runs += inningDetails.runs || 0;
            statistics[teamKey].wickets += inningDetails.wickets || 0;
            statistics[teamKey].extras += inningDetails.extras?.total || 0;
            statistics[teamKey].overs += inningDetails.overs || 0;

            // Add fall of wickets
            if (inningDetails.fallOfWickets) {
              statistics.fallOfWickets.push(...inningDetails.fallOfWickets);
            }

            // Add partnerships
            if (inningDetails.partnerships) {
              statistics.partnerships.push(...inningDetails.partnerships);
            }
          }
        }
      }

      // Sort partnerships by runs
      statistics.partnerships.sort((a, b) => b.runs - a.runs);
      
      // Sort fall of wickets by wicket number
      statistics.fallOfWickets.sort((a, b) => a.wicketNumber - b.wicketNumber);

      res.status(200).json({
        success: true,
        data: {
          match: {
            title: match.title,
            format: match.format,
            date: match.date,
            status: match.status,
            result: match.result
          },
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add inning to match
  addInning: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { inningId } = req.body;

      const match = await Match.findById(id);
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      const inning = await Inning.findById(inningId);
      
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Add inning to match
      match.innings.push(inningId);
      
      // Update match status based on inning number
      if (inning.inningNumber === 1) {
        match.status = 'inning_1';
      } else if (inning.inningNumber === 2) {
        match.status = 'inning_2';
      } else if (inning.inningNumber === 3) {
        match.status = 'inning_3';
      } else if (inning.inningNumber === 4) {
        match.status = 'inning_4';
      }
      
      await match.save();

      res.status(200).json({
        success: true,
        message: 'Inning added to match successfully',
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate shareable link for match
  generateShareLink: async (req, res, next) => {
    try {
      const { id } = req.params;

      const match = await Match.findById(id);
      
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Generate or get existing share code
      if (!match.shareCode) {
        await match.generateShareCode();
        await match.save();
      }

      const shareLink = `${process.env.CLIENT_URL}/match/${match.shareCode}`;

      res.status(200).json({
        success: true,
        data: {
          shareCode: match.shareCode,
          shareLink,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareLink)}`
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get match by share code
  getMatchByShareCode: async (req, res, next) => {
    try {
      const { shareCode } = req.params;

      const match = await Match.findOne({ shareCode })
        .populate('team1', 'name shortName logo')
        .populate('team2', 'name shortName logo')
        .populate('venue', 'name city')
        .populate('innings');

      if (!match) {
        throw new NotFoundError('Match not found with this share code');
      }

      res.status(200).json({
        success: true,
        data: { match }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = matchController;