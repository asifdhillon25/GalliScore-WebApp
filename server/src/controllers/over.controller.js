const Over = require('../models/Over.model');
const Inning = require('../models/Inning.model');
const Match = require('../models/Match.model');
const Player = require('../models/Player.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const overController = {
  // Get over by ID
  getOverById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const over = await Over.findById(id)
        .populate('bowler', 'displayName firstName lastName bowlingStyle')
        .populate('scoredBy', 'username firstName lastName')
        .populate('lastUpdatedBy', 'username firstName lastName');

      if (!over) {
        throw new NotFoundError('Over not found');
      }

      // Get inning details
      const inning = await Inning.findById(over.inningId)
        .select('inningNumber battingTeam bowlingTeam')
        .populate('battingTeam', 'name shortName')
        .populate('bowlingTeam', 'name shortName');

      res.status(200).json({
        success: true,
        data: {
          over,
          inning
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get overs for an inning
  getInningOvers: async (req, res, next) => {
    try {
      const { inningId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const overs = await Over.find({ inningId })
        .populate('bowler', 'displayName firstName lastName')
        .sort({ overNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Over.countDocuments({ inningId });

      res.status(200).json({
        success: true,
        data: {
          overs,
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

  // Update over details
  updateOver: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const over = await Over.findByIdAndUpdate(
        id,
        {
          ...updateData,
          lastUpdatedBy: userId,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!over) {
        throw new NotFoundError('Over not found');
      }

      // Recalculate over stats
      over.updateOverStats();
      await over.save();

      res.status(200).json({
        success: true,
        message: 'Over updated successfully',
        data: { over }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete over
  deleteOver: async (req, res, next) => {
    try {
      const { id } = req.params;

      const over = await Over.findById(id);
      if (!over) {
        throw new NotFoundError('Over not found');
      }

      // Check if over is part of a completed inning
      const inning = await Inning.findById(over.inningId);
      if (inning && inning.status === 'completed') {
        throw new ValidationError('Cannot delete over from a completed inning');
      }

      await Over.findByIdAndDelete(id);

      // Remove from inning's overs history
      if (inning) {
        inning.oversHistory = inning.oversHistory.filter(
          overId => overId.toString() !== id
        );
        await inning.save();
      }

      res.status(200).json({
        success: true,
        message: 'Over deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get over summary
  getOverSummary: async (req, res, next) => {
    try {
      const { id } = req.params;

      const over = await Over.findById(id)
        .populate('bowler', 'displayName firstName lastName');

      if (!over) {
        throw new NotFoundError('Over not found');
      }

      // Analyze balls in over
      const ballAnalysis = {
        dotBalls: over.balls.filter(ball => 
          ball.runs === 0 && 
          ball.deliveryType === 'normal' && 
          !ball.isWicket
        ).length,
        singles: over.balls.filter(ball => ball.runs === 1).length,
        doubles: over.balls.filter(ball => ball.runs === 2).length,
        triples: over.balls.filter(ball => ball.runs === 3).length,
        boundaries: over.balls.filter(ball => ball.isBoundary).length,
        fours: over.balls.filter(ball => ball.boundaryType === '4').length,
        sixes: over.balls.filter(ball => ball.boundaryType === '6').length,
        wides: over.extras.wides,
        noBalls: over.extras.noBalls,
        byes: over.extras.byes,
        legByes: over.extras.legByes,
        wickets: over.wickets
      };

      // Calculate economy for this over
      const economy = over.runs / (over.legalBalls / 6);

      // Get ball-by-ball details
      const ballByBall = over.balls.map((ball, index) => ({
        ballNumber: index + 1,
        runs: ball.runs,
        deliveryType: ball.deliveryType,
        isBoundary: ball.isBoundary,
        boundaryType: ball.boundaryType,
        extras: ball.extras,
        isWicket: ball.isWicket,
        dismissal: ball.dismissal,
        description: ball.description,
        cumulativeRuns: over.balls
          .slice(0, index + 1)
          .reduce((sum, b) => sum + CricketRules.calculateBallRuns(b.runs, b.extras), 0)
      }));

      const summary = {
        overNumber: over.overNumber,
        bowler: over.bowler,
        runs: over.runs,
        wickets: over.wickets,
        extras: over.extras,
        legalBalls: over.legalBalls,
        isMaiden: over.isMaiden,
        economy: economy.toFixed(2),
        status: over.status,
        startTime: over.startTime,
        endTime: over.endTime,
        duration: over.duration,
        ballAnalysis,
        ballByBall
      };

      res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get bowler's spell (consecutive overs)
  getBowlerSpell: async (req, res, next) => {
    try {
      const { inningId, bowlerId } = req.params;

      const overs = await Over.find({
        inningId,
        bowler: bowlerId,
        status: 'completed'
      }).sort({ overNumber: 1 });

      if (overs.length === 0) {
        throw new NotFoundError('No overs found for this bowler');
      }

      // Group consecutive overs into spells
      const spells = [];
      let currentSpell = [];
      let prevOverNumber = null;

      for (const over of overs) {
        if (prevOverNumber === null || over.overNumber === prevOverNumber + 1) {
          currentSpell.push(over);
        } else {
          if (currentSpell.length > 0) {
            spells.push(currentSpell);
          }
          currentSpell = [over];
        }
        prevOverNumber = over.overNumber;
      }

      if (currentSpell.length > 0) {
        spells.push(currentSpell);
      }

      // Calculate spell statistics
      const spellStats = spells.map((spell, index) => {
        const totalOvers = spell.length;
        const totalRuns = spell.reduce((sum, over) => sum + over.runs, 0);
        const totalWickets = spell.reduce((sum, over) => sum + over.wickets, 0);
        const totalExtras = spell.reduce((sum, over) => sum + over.extras.total, 0);
        const maidens = spell.filter(over => over.isMaiden).length;

        return {
          spellNumber: index + 1,
          overs: totalOvers,
          runs: totalRuns,
          wickets: totalWickets,
          extras: totalExtras,
          maidens,
          economy: totalOvers > 0 ? (totalRuns / totalOvers).toFixed(2) : '0.00',
          average: totalWickets > 0 ? (totalRuns / totalWickets).toFixed(2) : '0.00',
          strikeRate: totalWickets > 0 ? 
            ((totalOvers * 6) / totalWickets).toFixed(2) : '0.00',
          startOver: spell[0].overNumber,
          endOver: spell[spell.length - 1].overNumber
        };
      });

      res.status(200).json({
        success: true,
        data: {
          bowler: await Player.findById(bowlerId).select('displayName firstName lastName'),
          spells: spellStats,
          totalSpells: spells.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get maiden overs in an inning
  getMaidenOvers: async (req, res, next) => {
    try {
      const { inningId } = req.params;

      const maidenOvers = await Over.find({
        inningId,
        isMaiden: true,
        status: 'completed'
      })
      .populate('bowler', 'displayName firstName lastName')
      .sort({ overNumber: 1 });

      res.status(200).json({
        success: true,
        data: {
          maidenOvers,
          count: maidenOvers.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get wicket-taking overs
  getWicketOvers: async (req, res, next) => {
    try {
      const { inningId } = req.params;

      const wicketOvers = await Over.find({
        inningId,
        wickets: { $gt: 0 },
        status: 'completed'
      })
      .populate('bowler', 'displayName firstName lastName')
      .sort({ wickets: -1, overNumber: 1 });

      res.status(200).json({
        success: true,
        data: {
          wicketOvers,
          totalWickets: wicketOvers.reduce((sum, over) => sum + over.wickets, 0)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get expensive overs (most runs conceded)
  getExpensiveOvers: async (req, res, next) => {
    try {
      const { inningId, limit = 5 } = req.params;

      const expensiveOvers = await Over.find({
        inningId,
        status: 'completed'
      })
      .populate('bowler', 'displayName firstName lastName')
      .sort({ runs: -1 })
      .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        data: { expensiveOvers }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get over-by-over progression
  getOverByOverProgression: async (req, res, next) => {
    try {
      const { inningId } = req.params;

      const overs = await Over.find({
        inningId,
        status: 'completed'
      }).sort({ overNumber: 1 });

      const progression = overs.map((over, index) => {
        const cumulativeRuns = overs
          .slice(0, index + 1)
          .reduce((sum, o) => sum + o.runs, 0);
        
        const cumulativeWickets = overs
          .slice(0, index + 1)
          .reduce((sum, o) => sum + o.wickets, 0);

        return {
          overNumber: over.overNumber,
          runs: over.runs,
          wickets: over.wickets,
          extras: over.extras.total,
          cumulativeRuns,
          cumulativeWickets,
          runRate: ((index + 1) > 0 ? cumulativeRuns / (index + 1) : 0).toFixed(2)
        };
      });

      res.status(200).json({
        success: true,
        data: { progression }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = overController;