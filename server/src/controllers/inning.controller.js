const Inning = require('../models/Inning.model');
const Match = require('../models/Match.model');
const Team = require('../models/Team.model');
const Player = require('../models/Player.model');
const Over = require('../models/Over.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const inningController = {
  // Get inning by ID
  getInningById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const inning = await Inning.findById(id)
        .populate('battingTeam', 'name shortName logo')
        .populate('bowlingTeam', 'name shortName logo')
        .populate('currentBatsmen.striker', 'displayName firstName lastName')
        .populate('currentBatsmen.nonStriker', 'displayName firstName lastName')
        .populate('currentBowler', 'displayName firstName lastName')
        .populate('fallOfWickets.batsman', 'displayName firstName lastName')
        .populate('fallOfWickets.dismissal')
        .populate('partnerships.batsman1', 'displayName firstName lastName')
        .populate('partnerships.batsman2', 'displayName firstName lastName')
        .populate('playingXI.batting.player', 'displayName firstName lastName primaryRole battingStyle')
        .populate('playingXI.bowling.player', 'displayName firstName lastName primaryRole bowlingStyle')
        .populate('scoredBy', 'username firstName lastName')
        .populate('lastUpdatedBy', 'username firstName lastName');

      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Get overs for this inning
      const overs = await Over.find({ inningId: id })
        .populate('bowler', 'displayName firstName lastName')
        .sort({ overNumber: 1 });

      res.status(200).json({
        success: true,
        data: {
          inning,
          overs
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get innings for a match
  getMatchInnings: async (req, res, next) => {
    try {
      const { matchId } = req.params;

      const innings = await Inning.find({ matchId })
        .populate('battingTeam', 'name shortName')
        .populate('bowlingTeam', 'name shortName')
        .sort({ inningNumber: 1 });

      res.status(200).json({
        success: true,
        data: { innings }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update inning details
  updateInning: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const inning = await Inning.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      res.status(200).json({
        success: true,
        message: 'Inning updated successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  },

  // Declare innings (for test matches)
  declareInnings: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { declaredBy, reason } = req.body;

      const inning = await Inning.findById(id);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      const match = await Match.findById(inning.matchId);
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Check if declaration is allowed
      if (match.format !== 'test') {
        throw new ValidationError('Declaration only allowed in test matches');
      }

      if (inning.status !== 'in_progress') {
        throw new ValidationError('Can only declare an inning in progress');
      }

      // Update inning
      inning.status = 'declared';
      inning.endTime = new Date();
      inning.duration = Math.round((inning.endTime - inning.startTime) / (1000 * 60));
      inning.declaration = {
        declared: true,
        declaredBy,
        declaredAt: new Date(),
        reason
      };

      await inning.save();

      // Update match status
      if (inning.inningNumber === 1) {
        match.status = 'inning_2';
      } else if (inning.inningNumber === 2) {
        match.status = 'inning_3';
      } else if (inning.inningNumber === 3) {
        match.status = 'inning_4';
      }

      await match.save();

      res.status(200).json({
        success: true,
        message: 'Inning declared successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  },

  // Follow-on enforcement
  enforceFollowOn: async (req, res, next) => {
    try {
      const { matchId } = req.params;
      const { enforcedBy } = req.body;

      const match = await Match.findById(matchId);
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      if (match.format !== 'test') {
        throw new ValidationError('Follow-on only applicable in test matches');
      }

      // Get first two innings
      const innings = await Inning.find({ 
        matchId,
        inningNumber: { $in: [1, 2] }
      }).sort({ inningNumber: 1 });

      if (innings.length !== 2) {
        throw new ValidationError('Need both first and second innings to enforce follow-on');
      }

      const [firstInning, secondInning] = innings;

      // Check follow-on conditions
      const lead = firstInning.runs - secondInning.runs;
      if (lead < 200) {
        throw new ValidationError(`Lead of ${lead} runs is insufficient for follow-on (minimum 200)`);
      }

      // Update second inning
      secondInning.followOn = {
        enforced: true,
        enforcedBy
      };

      await secondInning.save();

      // Create third inning (follow-on)
      const thirdInning = await Inning.create({
        inningNumber: 3,
        matchId,
        battingTeam: secondInning.battingTeam, // Same team bats again
        bowlingTeam: secondInning.bowlingTeam,
        playingXI: secondInning.playingXI,
        target: firstInning.runs + 1, // Need to beat first innings total
        oversLimit: Infinity, // No over limit in tests
        wicketsLimit: 10,
        status: 'not_started',
        scoredBy: req.user._id
      });

      match.innings.push(thirdInning._id);
      match.status = 'inning_3';
      await match.save();

      res.status(200).json({
        success: true,
        message: 'Follow-on enforced successfully',
        data: {
          lead,
          thirdInning
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get inning summary
  getInningSummary: async (req, res, next) => {
    try {
      const { id } = req.params;

      const inning = await Inning.findById(id)
        .populate('battingTeam', 'name shortName logo')
        .populate('bowlingTeam', 'name shortName logo');

      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Get batting stats
      const battingStats = await BattingStats.find({ inning: id })
        .populate('player', 'displayName firstName lastName')
        .sort('battingPosition');

      // Get bowling stats
      const bowlingStats = await BowlingStats.find({ inning: id })
        .populate('player', 'displayName firstName lastName')
        .sort({ wickets: -1, runs: 1 });

      // Get partnerships
      const partnerships = inning.partnerships.map(p => ({
        batsman1: p.batsman1,
        batsman2: p.batsman2,
        runs: p.runs,
        balls: p.balls,
        runRate: p.balls > 0 ? (p.runs / p.balls) * 100 : 0
      }));

      // Sort partnerships by runs
      partnerships.sort((a, b) => b.runs - a.runs);

      // Get fall of wickets
      const fallOfWickets = await Promise.all(
        inning.fallOfWickets.map(async (fow) => {
          const batsman = await Player.findById(fow.batsman).select('displayName');
          return {
            wicketNumber: fow.wicketNumber,
            score: `${fow.runs}/${fow.wicketNumber}`,
            batsman: batsman?.displayName,
            runs: fow.runs,
            overs: `${fow.overs}.${fow.balls}`,
            partnership: fow.partnership
          };
        })
      );

      const summary = {
        inningNumber: inning.inningNumber,
        battingTeam: inning.battingTeam,
        bowlingTeam: inning.bowlingTeam,
        total: `${inning.runs}/${inning.wickets}`,
        overs: `${inning.overs}.${inning.balls}`,
        extras: inning.extras.total,
        runRate: ((inning.overs * 6) + inning.balls) > 0 ? 
          (inning.runs / ((inning.overs * 6) + inning.balls)) * 6 : 0,
        status: inning.status,
        startTime: inning.startTime,
        endTime: inning.endTime,
        duration: inning.duration,
        battingStats,
        bowlingStats,
        partnerships: partnerships.slice(0, 5), // Top 5 partnerships
        fallOfWickets,
        powerplays: inning.powerplays
      };

      res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current partnership
  getCurrentPartnership: async (req, res, next) => {
    try {
      const { id } = req.params;

      const inning = await Inning.findById(id)
        .populate('currentBatsmen.striker', 'displayName firstName lastName')
        .populate('currentBatsmen.nonStriker', 'displayName firstName lastName');

      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      if (inning.status !== 'in_progress') {
        throw new ValidationError('Inning is not in progress');
      }

      const currentPartnership = inning.partnerships[inning.partnerships.length - 1];
      
      if (!currentPartnership) {
        throw new NotFoundError('No active partnership');
      }

      const partnership = {
        batsman1: currentPartnership.batsman1,
        batsman2: currentPartnership.batsman2,
        runs: currentPartnership.runs,
        balls: currentPartnership.balls,
        runRate: currentPartnership.balls > 0 ? 
          (currentPartnership.runs / currentPartnership.balls) * 100 : 0,
        startedAt: currentPartnership.startedAt,
        duration: currentPartnership.endedAt ? 
          Math.round((currentPartnership.endedAt - currentPartnership.startedAt) / (1000 * 60)) : 
          Math.round((new Date() - currentPartnership.startedAt) / (1000 * 60))
      };

      res.status(200).json({
        success: true,
        data: { partnership }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get powerplay status
  getPowerplayStatus: async (req, res, next) => {
    try {
      const { id } = req.params;

      const inning = await Inning.findById(id);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      const match = await Match.findById(inning.matchId);
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      const currentOver = inning.overs + (inning.balls / 6);
      const powerplayRules = CricketRules.getPowerplayRules(match.format);

      let currentPowerplay = null;
      let nextPowerplay = null;
      let powerplayOversRemaining = 0;

      // Find current powerplay
      for (const [type, range] of Object.entries(powerplayRules)) {
        if (range && currentOver >= range.from && currentOver <= range.to) {
          currentPowerplay = {
            type,
            fromOver: range.from,
            toOver: range.to,
            oversCompleted: currentOver - range.from,
            oversRemaining: range.to - currentOver
          };
          powerplayOversRemaining = range.to - currentOver;
          break;
        }
      }

      // Find next powerplay
      if (!currentPowerplay) {
        for (const [type, range] of Object.entries(powerplayRules)) {
          if (range && currentOver < range.from) {
            nextPowerplay = {
              type,
              fromOver: range.from,
              toOver: range.to,
              oversUntil: range.from - currentOver
            };
            break;
          }
        }
      }

      // Calculate powerplay statistics
      const powerplayStats = inning.powerplays.map(pp => ({
        type: pp.type,
        fromOver: pp.fromOver,
        toOver: pp.toOver,
        runs: pp.runs,
        wickets: pp.wickets,
        runRate: pp.runs / (pp.toOver - pp.fromOver + 1)
      }));

      res.status(200).json({
        success: true,
        data: {
          currentPowerplay,
          nextPowerplay,
          powerplayOversRemaining,
          powerplayStats,
          allPowerplays: powerplayRules
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Add interruption (rain, bad light, etc.)
  addInterruption: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, startTime, endTime, duration } = req.body;

      const inning = await Inning.findById(id);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      if (inning.status !== 'in_progress') {
        throw new ValidationError('Can only add interruption to inning in progress');
      }

      const interruption = {
        reason,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        duration: duration || null
      };

      inning.interruptions.push(interruption);
      await inning.save();

      res.status(200).json({
        success: true,
        message: 'Interruption recorded',
        data: { interruption }
      });
    } catch (error) {
      next(error);
    }
  },

  // End interruption
  endInterruption: async (req, res, next) => {
    try {
      const { id } = req.params;

      const inning = await Inning.findById(id);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      const lastInterruption = inning.interruptions[inning.interruptions.length - 1];
      
      if (!lastInterruption || lastInterruption.endTime) {
        throw new ValidationError('No active interruption to end');
      }

      lastInterruption.endTime = new Date();
      lastInterruption.duration = Math.round(
        (lastInterruption.endTime - lastInterruption.startTime) / (1000 * 60)
      );

      await inning.save();

      res.status(200).json({
        success: true,
        message: 'Interruption ended',
        data: { interruption: lastInterruption }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = inningController;