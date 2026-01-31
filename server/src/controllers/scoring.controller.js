const Inning = require('../models/Inning.model');
const Over = require('../models/Over.model');
const Match = require('../models/Match.model');
const Player = require('../models/Player.model');
const BattingStats = require('../models/BattingStats.model');
const BowlingStats = require('../models/BowlingStats.model');
const CricketRules = require('../utils/cricketRules');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

class ScoringController {
  // Initialize a new inning
  static async initializeInning(req, res, next) {
    try {
      const { matchId, inningNumber, battingTeamId, bowlingTeamId, playingXI } = req.body;
      const userId = req.user._id;

      // Validate match exists
      const match = await Match.findById(matchId);
      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Validate teams
      const [battingTeam, bowlingTeam] = await Promise.all([
        Team.findById(battingTeamId),
        Team.findById(bowlingTeamId)
      ]);

      if (!battingTeam || !bowlingTeam) {
        throw new ValidationError('One or both teams not found');
      }

      // Validate playing XI
      if (!playingXI || !playingXI.batting || !playingXI.bowling) {
        throw new ValidationError('Playing XI must include batting and bowling squads');
      }

      // Create inning
      const inning = await Inning.create({
        inningNumber,
        matchId,
        battingTeam: battingTeamId,
        bowlingTeam: bowlingTeamId,
        playingXI,
        oversLimit: match.rules.oversPerInning,
        wicketsLimit: 10,
        status: 'not_started',
        scoredBy: userId
      });

      // Update match status
      match.innings.push(inning._id);
      await match.save();

      res.status(201).json({
        success: true,
        message: 'Inning initialized successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  }

  // Start an inning
  static async startInning(req, res, next) {
    try {
      const { inningId } = req.params;
      const { strikerId, nonStrikerId, bowlerId } = req.body;

      const inning = await Inning.findById(inningId);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      if (inning.status !== 'not_started') {
        throw new ValidationError('Inning can only be started from not_started status');
      }

      // Validate players are in playing XI
      const isStrikerValid = inning.playingXI.batting.some(p => 
        p.player.toString() === strikerId
      );
      const isNonStrikerValid = inning.playingXI.batting.some(p => 
        p.player.toString() === nonStrikerId
      );
      const isBowlerValid = inning.playingXI.bowling.some(p => 
        p.player.toString() === bowlerId
      );

      if (!isStrikerValid || !isNonStrikerValid || !isBowlerValid) {
        throw new ValidationError('One or more players not in playing XI');
      }

      // Start inning
      inning.status = 'in_progress';
      inning.startTime = new Date();
      inning.currentBatsmen = {
        striker: strikerId,
        nonStriker: nonStrikerId
      };
      inning.currentBowler = bowlerId;

      await inning.save();

      // Create initial batting stats
      await Promise.all([
        BattingStats.create({
          player: strikerId,
          match: inning.matchId,
          inning: inning._id,
          team: inning.battingTeam,
          inningNumber: inning.inningNumber,
          battingPosition: 1,
          startTime: new Date()
        }),
        BattingStats.create({
          player: nonStrikerId,
          match: inning.matchId,
          inning: inning._id,
          team: inning.battingTeam,
          inningNumber: inning.inningNumber,
          battingPosition: 2,
          startTime: new Date()
        }),
        BowlingStats.create({
          player: bowlerId,
          match: inning.matchId,
          inning: inning._id,
          team: inning.bowlingTeam,
          startTime: new Date()
        })
      ]);

      res.status(200).json({
        success: true,
        message: 'Inning started successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  }

  // Score a ball (MAIN SCORING FUNCTION)
  static async scoreBall(req, res, next) {
    try {
      const { inningId } = req.params;
      const ballData = req.body;
      const userId = req.user._id;

      const inning = await Inning.findById(inningId);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      if (inning.status !== 'in_progress') {
        throw new ValidationError('Cannot score ball - inning is not in progress');
      }

      // Validate ball data
      const validation = this.validateBallData(ballData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }

      // Get current over or create new one
      let over = await Over.findOne({
        inningId,
        overNumber: ballData.overNumber,
        status: 'in_progress'
      });

      if (!over) {
        over = await Over.create({
          overNumber: ballData.overNumber,
          inningId,
          matchId: inning.matchId,
          bowler: ballData.bowler,
          balls: [],
          status: 'in_progress',
          startTime: new Date(),
          scoredBy: userId
        });

        inning.oversHistory.push(over._id);
      }

      // Add ball to over
      const ballToAdd = {
        ballNumber: ballData.ballNumber,
        overNumber: ballData.overNumber,
        runs: ballData.runs,
        isBoundary: CricketRules.isValidBoundary(ballData.runs, ballData.deliveryType),
        boundaryType: ballData.runs === 4 ? '4' : ballData.runs === 6 ? '6' : null,
        deliveryType: ballData.deliveryType,
        isWicket: ballData.isWicket,
        dismissal: ballData.dismissal,
        batsman: ballData.batsman,
        bowler: ballData.bowler,
        nonStriker: ballData.nonStriker,
        fielder: ballData.fielder,
        extras: ballData.extras || {},
        description: ballData.description,
        timestamp: new Date()
      };

      await over.addBall(ballToAdd);
      await over.save();

      // Update inning statistics
      await this.updateInningAfterBall(inning, over, ballToAdd);

      // Update player statistics
      await this.updatePlayerStats(inning, ballToAdd);

      // Check if over is complete
      if (over.status === 'completed') {
        await this.handleOverComplete(inning, over);
      }

      // Check if inning is complete
      const inningComplete = CricketRules.isInningsComplete(
        inning.wickets,
        inning.overs,
        inning.wicketsLimit,
        inning.oversLimit
      );

      if (inningComplete.completed) {
        await this.endInning(inning, inningComplete.reason);
      }

      // Get updated inning data
      const updatedInning = await Inning.findById(inningId)
        .populate('currentBatsmen.striker', 'displayName')
        .populate('currentBatsmen.nonStriker', 'displayName')
        .populate('currentBowler', 'displayName');

      res.status(200).json({
        success: true,
        message: 'Ball scored successfully',
        data: {
          ball: ballToAdd,
          over,
          inning: updatedInning,
          inningComplete: inningComplete.completed
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Validate ball data
  static validateBallData(ballData) {
    const errors = [];

    // Required fields
    const requiredFields = ['overNumber', 'ballNumber', 'runs', 'batsman', 'bowler', 'nonStriker', 'deliveryType'];
    requiredFields.forEach(field => {
      if (ballData[field] === undefined || ballData[field] === null) {
        errors.push(`${field} is required`);
      }
    });

    // Validate ball number
    if (ballData.ballNumber < 1 || ballData.ballNumber > 6) {
      errors.push('Ball number must be between 1 and 6');
    }

    // Validate runs
    if (!CricketRules.isValidRunsForDelivery(ballData.runs, ballData.deliveryType)) {
      errors.push(`Invalid runs ${ballData.runs} for delivery type ${ballData.deliveryType}`);
    }

    // Validate dismissal
    if (ballData.isWicket && ballData.dismissal) {
      if (!CricketRules.isValidDismissal(ballData.dismissal.type, ballData.deliveryType)) {
        errors.push(`Invalid dismissal ${ballData.dismissal.type} for delivery type ${ballData.deliveryType}`);
      }
    }

    // Validate extras
    if (ballData.extras) {
      const extras = ballData.extras;
      if (extras.wides && extras.wides < 0) errors.push('Wides cannot be negative');
      if (extras.noBalls && extras.noBalls < 0) errors.push('No balls cannot be negative');
      if (extras.byes && extras.byes < 0) errors.push('Byes cannot be negative');
      if (extras.legByes && extras.legByes < 0) errors.push('Leg byes cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update inning after ball is scored
  static async updateInningAfterBall(inning, over, ball) {
    // Calculate total runs from ball
    const ballRuns = CricketRules.calculateBallRuns(ball.runs, ball.extras);
    
    // Update inning runs
    inning.runs += ballRuns;

    // Update wickets if wicket taken
    if (ball.isWicket) {
      inning.wickets += 1;

      // Add to fall of wickets
      const fallOfWicket = {
        wicketNumber: inning.wickets,
        runs: inning.runs,
        partnership: inning.runs - (inning.fallOfWickets[inning.fallOfWickets.length - 1]?.runs || 0),
        overs: inning.overs,
        balls: inning.balls,
        batsman: ball.batsman,
        dismissal: ball.dismissal,
        timestamp: new Date()
      };

      inning.fallOfWickets.push(fallOfWicket);

      // End current partnership
      if (inning.partnerships.length > 0) {
        const currentPartnership = inning.partnerships[inning.partnerships.length - 1];
        currentPartnership.endedAt = new Date();
        currentPartnership.balls = (inning.overs * 6) + inning.balls;
      }

      // Handle new batsman coming in
      await this.handleWicket(inning, ball);
    }

    // Update extras
    if (ball.extras) {
      inning.extras.wides += ball.extras.wides || 0;
      inning.extras.noBalls += ball.extras.noBalls || 0;
      inning.extras.byes += ball.extras.byes || 0;
      inning.extras.legByes += ball.extras.legByes || 0;
      inning.extras.penalty += ball.extras.penalty || 0;
      inning.extras.total += CricketRules.calculateBallRuns(0, ball.extras);
    }

    // Update balls/overs
    if (CricketRules.countsTowardsOver(ball.deliveryType)) {
      inning.balls += 1;
      if (inning.balls >= 6) {
        inning.overs += 1;
        inning.balls = 0;
      }
    }

    // Update current partnership
    await this.updatePartnership(inning, ball);

    // Update powerplay status
    await this.updatePowerplayStatus(inning);

    await inning.save();
  }

  // Handle wicket fall
  static async handleWicket(inning, ball) {
    // Get new batsman (next in batting order)
    const battingOrder = inning.playingXI.batting.sort((a, b) => a.battingPosition - b.battingPosition);
    const dismissedBatsmanIndex = battingOrder.findIndex(p => p.player.toString() === ball.batsman.toString());
    
    let newBatsman = null;
    
    // Find next batsman who hasn't batted yet
    for (let i = dismissedBatsmanIndex + 1; i < battingOrder.length; i++) {
      const player = battingOrder[i];
      // Check if player is already out or still to bat
      const isOut = inning.fallOfWickets.some(fow => 
        fow.batsman.toString() === player.player.toString()
      );
      
      if (!isOut) {
        newBatsman = player.player;
        break;
      }
    }

    if (newBatsman) {
      // Update striker based on who was dismissed
      if (ball.batsman.toString() === inning.currentBatsmen.striker.toString()) {
        inning.currentBatsmen.striker = newBatsman;
        
        // Create new batting stats for new batsman
        await BattingStats.create({
          player: newBatsman,
          match: inning.matchId,
          inning: inning._id,
          team: inning.battingTeam,
          inningNumber: inning.inningNumber,
          battingPosition: battingOrder.find(p => p.player.toString() === newBatsman.toString())?.battingPosition || 11,
          startTime: new Date()
        });
      }
    }

    // Check if all out
    if (inning.wickets >= inning.wicketsLimit) {
      inning.status = 'completed';
      inning.endTime = new Date();
    }
  }

  // Update partnership
  static async updatePartnership(inning, ball) {
    if (inning.partnerships.length === 0) {
      // Start first partnership
      inning.partnerships.push({
        batsman1: inning.currentBatsmen.striker,
        batsman2: inning.currentBatsmen.nonStriker,
        runs: 0,
        balls: 0,
        startedAt: new Date()
      });
    }

    const currentPartnership = inning.partnerships[inning.partnerships.length - 1];
    
    // Only count runs towards partnership if not extras (except byes/leg byes)
    if (ball.deliveryType === 'normal' || ball.deliveryType === 'bye' || ball.deliveryType === 'leg_bye') {
      currentPartnership.runs += ball.runs || 0;
    }

    // Count balls towards partnership
    if (CricketRules.countsTowardsOver(ball.deliveryType)) {
      currentPartnership.balls += 1;
    }
  }

  // Update powerplay status
  static async updatePowerplayStatus(inning) {
    const match = await Match.findById(inning.matchId);
    if (!match) return;

    const powerplayRules = CricketRules.getPowerplayRules(match.format);
    const currentOver = inning.overs + (inning.balls / 6);

    // Check mandatory powerplay
    if (powerplayRules.mandatory) {
      if (currentOver >= powerplayRules.mandatory.from && currentOver <= powerplayRules.mandatory.to) {
        if (!inning.powerplays.some(pp => pp.type === 'mandatory')) {
          inning.powerplays.push({
            type: 'mandatory',
            fromOver: powerplayRules.mandatory.from,
            toOver: powerplayRules.mandatory.to,
            runs: 0,
            wickets: 0
          });
        }
      }
    }

    // Update current powerplay runs/wickets
    const activePowerplay = inning.powerplays.find(pp => 
      currentOver >= pp.fromOver && currentOver <= pp.toOver
    );

    if (activePowerplay) {
      // This would be updated with each ball in updateInningAfterBall
    }
  }

  // Update player statistics
  static async updatePlayerStats(inning, ball) {
    // Update batsman stats
    const battingStats = await BattingStats.findOne({
      player: ball.batsman,
      inning: inning._id,
      match: inning.matchId
    });

    if (battingStats) {
      await battingStats.addBall(
        ball.runs,
        ball.isBoundary,
        ball.runs === 0 && ball.deliveryType === 'normal'
      );
    }

    // Update bowler stats
    const bowlingStats = await BowlingStats.findOne({
      player: ball.bowler,
      inning: inning._id,
      match: inning.matchId
    });

    if (bowlingStats) {
      const isDotBall = ball.runs === 0 && 
                       ball.deliveryType === 'normal' && 
                       !ball.isWicket;
      const isBoundary = ball.isBoundary;

      await bowlingStats.addBall(
        ball.runs,
        ball.isWicket,
        ball.extras || {},
        isBoundary,
        isDotBall
      );

      // Add wicket details if wicket taken
      if (ball.isWicket && ball.dismissal) {
        await bowlingStats.addWicket(
          ball.batsman,
          ball.dismissal._id,
          ball.fielder,
          ball.runs,
          1 // balls in this spell
        );
      }
    }

    // Update fielder stats if catch/run out
    if (ball.fielder && (ball.dismissal?.type === 'caught' || ball.dismissal?.type === 'run_out')) {
      // Update fielder's fielding stats
      // This would require a FieldingStats model
    }
  }

  // Handle over completion
  static async handleOverComplete(inning, over) {
    // Swap striker and non-striker
    const temp = inning.currentBatsmen.striker;
    inning.currentBatsmen.striker = inning.currentBatsmen.nonStriker;
    inning.currentBatsmen.nonStriker = temp;

    // Check if we need to change bowler (based on max overs per bowler)
    const match = await Match.findById(inning.matchId);
    if (match) {
      const maxOversPerBowler = CricketRules.getMaxOversPerBowler(match.format, match.rules.oversPerInning);
      
      // Get all overs bowled by current bowler in this inning
      const bowlerOvers = await Over.countDocuments({
        inningId: inning._id,
        bowler: inning.currentBowler,
        status: 'completed'
      });

      if (bowlerOvers >= maxOversPerBowler) {
        // Bowler has completed quota - need to select new bowler
        // This would involve selecting from available bowlers in playing XI
        inning.currentBowler = null; // Frontend should prompt for new bowler
      }
    }

    await inning.save();
  }

  // End inning
  static async endInning(inning, reason) {
    inning.status = 'completed';
    inning.endTime = new Date();
    inning.duration = Math.round((inning.endTime - inning.startTime) / (1000 * 60));

    // End all active partnerships
    if (inning.partnerships.length > 0) {
      const lastPartnership = inning.partnerships[inning.partnerships.length - 1];
      if (!lastPartnership.endedAt) {
        lastPartnership.endedAt = new Date();
      }
    }

    // Complete all batting stats
    const battingStats = await BattingStats.find({
      inning: inning._id,
      match: inning.matchId
    });

    for (const stats of battingStats) {
      if (!stats.endTime) {
        stats.endTime = new Date();
        stats.duration = Math.round((stats.endTime - stats.startTime) / (1000 * 60));
        await stats.save();
      }
    }

    // Complete all bowling stats
    const bowlingStats = await BowlingStats.find({
      inning: inning._id,
      match: inning.matchId
    });

    for (const stats of bowlingStats) {
      if (!stats.endTime) {
        stats.endTime = new Date();
        stats.duration = Math.round((stats.endTime - stats.startTime) / (1000 * 60));
        await stats.save();
      }
    }

    await inning.save();

    // Update match status
    const match = await Match.findById(inning.matchId);
    if (match) {
      if (inning.inningNumber === 1) {
        match.status = 'inning_2';
      } else if (inning.inningNumber === 2) {
        // Check if match is complete or needs 3rd/4th innings
        if (match.format === 'test') {
          // For test matches, check follow-on possibility
          const firstInning = await Inning.findOne({
            matchId: match._id,
            inningNumber: 1
          });
          
          if (firstInning) {
            const lead = firstInning.runs - inning.runs;
            if (lead >= 200) {
              // Follow-on possible
              match.status = 'inning_3';
            } else {
              // Normal 3rd innings
              match.status = 'inning_3';
            }
          }
        } else {
          // Limited overs match is complete
          match.status = 'completed';
        }
      }
      await match.save();
    }
  }

  // Undo last ball (for corrections)
  static async undoBall(req, res, next) {
    try {
      const { inningId } = req.params;
      const userId = req.user._id;

      const inning = await Inning.findById(inningId);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Get the latest over
      const latestOver = await Over.findOne({
        inningId,
        status: { $in: ['in_progress', 'completed'] }
      }).sort({ overNumber: -1 });

      if (!latestOver || latestOver.balls.length === 0) {
        throw new ValidationError('No balls to undo');
      }

      // Get the last ball
      const lastBall = latestOver.balls[latestOver.balls.length - 1];

      // Remove ball from over
      latestOver.balls.pop();
      
      // Recalculate over stats
      latestOver.updateOverStats();
      
      // If over has no balls, delete it
      if (latestOver.balls.length === 0) {
        await Over.findByIdAndDelete(latestOver._id);
        inning.oversHistory = inning.oversHistory.filter(id => id.toString() !== latestOver._id.toString());
      } else {
        await latestOver.save();
      }

      // Reverse inning statistics
      await this.reverseInningStats(inning, lastBall);

      // Reverse player statistics
      await this.reversePlayerStats(inning, lastBall);

      // Get updated inning
      const updatedInning = await Inning.findById(inningId)
        .populate('currentBatsmen.striker', 'displayName')
        .populate('currentBatsmen.nonStriker', 'displayName')
        .populate('currentBowler', 'displayName');

      res.status(200).json({
        success: true,
        message: 'Last ball undone successfully',
        data: {
          undoneBall: lastBall,
          inning: updatedInning
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Reverse inning statistics after undo
  static async reverseInningStats(inning, ball) {
    const ballRuns = CricketRules.calculateBallRuns(ball.runs, ball.extras);
    
    // Reverse runs
    inning.runs -= ballRuns;

    // Reverse wicket if taken
    if (ball.isWicket) {
      inning.wickets -= 1;
      
      // Remove from fall of wickets
      inning.fallOfWickets.pop();
      
      // This is complex - would need to restore previous batsman
      // For simplicity, we'll mark this as needing manual correction
    }

    // Reverse extras
    if (ball.extras) {
      inning.extras.wides -= ball.extras.wides || 0;
      inning.extras.noBalls -= ball.extras.noBalls || 0;
      inning.extras.byes -= ball.extras.byes || 0;
      inning.extras.legByes -= ball.extras.legByes || 0;
      inning.extras.penalty -= ball.extras.penalty || 0;
      inning.extras.total -= CricketRules.calculateBallRuns(0, ball.extras);
    }

    // Reverse balls/overs
    if (CricketRules.countsTowardsOver(ball.deliveryType)) {
      if (inning.balls === 0) {
        inning.overs -= 1;
        inning.balls = 5;
      } else {
        inning.balls -= 1;
      }
    }

    await inning.save();
  }

  // Reverse player statistics after undo
  static async reversePlayerStats(inning, ball) {
    // Reverse batsman stats
    const battingStats = await BattingStats.findOne({
      player: ball.batsman,
      inning: inning._id,
      match: inning.matchId
    });

    if (battingStats) {
      battingStats.runs -= ball.runs || 0;
      battingStats.ballsFaced -= 1;
      
      if (ball.runs === 4) battingStats.fours -= 1;
      if (ball.runs === 6) battingStats.sixes -= 1;
      
      if (ball.runs === 0 && ball.deliveryType === 'normal') {
        battingStats.dotBalls -= 1;
      } else {
        battingStats.scoringShots -= 1;
      }
      
      battingStats.updateStats();
      await battingStats.save();
    }

    // Reverse bowler stats
    const bowlingStats = await BowlingStats.findOne({
      player: ball.bowler,
      inning: inning._id,
      match: inning.matchId
    });

    if (bowlingStats) {
      // This is complex - would need to properly reverse
      // For now, we'll mark for manual correction
    }
  }

  // Get current match state for scoring interface
  static async getScoringState(req, res, next) {
    try {
      const { matchId } = req.params;

      const match = await Match.findById(matchId)
        .populate('team1', 'name shortName logo')
        .populate('team2', 'name shortName logo')
        .populate('innings');

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      let currentInning = null;
      let currentOver = null;
      let availableBatsmen = [];
      let availableBowlers = [];

      // Get current inning
      if (match.innings && match.innings.length > 0) {
        currentInning = await Inning.findById(match.innings[match.innings.length - 1])
          .populate('battingTeam', 'name shortName')
          .populate('bowlingTeam', 'name shortName')
          .populate('currentBatsmen.striker', 'displayName firstName lastName')
          .populate('currentBatsmen.nonStriker', 'displayName firstName lastName')
          .populate('currentBowler', 'displayName firstName lastName')
          .populate('playingXI.batting.player', 'displayName firstName lastName primaryRole')
          .populate('playingXI.bowling.player', 'displayName firstName lastName primaryRole');

        // Get current over
        currentOver = await Over.findOne({
          inningId: currentInning._id,
          status: 'in_progress'
        }).sort({ overNumber: -1 });

        // Get available batsmen (not out)
        if (currentInning.playingXI.batting) {
          const outBatsmen = currentInning.fallOfWickets.map(fow => fow.batsman.toString());
          availableBatsmen = currentInning.playingXI.batting
            .filter(p => !outBatsmen.includes(p.player._id.toString()))
            .map(p => p.player);
        }

        // Get available bowlers
        if (currentInning.playingXI.bowling) {
          availableBowlers = currentInning.playingXI.bowling.map(p => p.player);
        }
      }

      // Calculate match situation
      const matchSituation = {
        target: currentInning?.target || 0,
        runsNeeded: currentInning?.target ? currentInning.target - currentInning.runs : 0,
        ballsRemaining: currentInning ? 
          (currentInning.oversLimit * 6) - ((currentInning.overs * 6) + currentInning.balls) : 0,
        wicketsRemaining: currentInning ? currentInning.wicketsLimit - currentInning.wickets : 0,
        requiredRunRate: currentInning?.target ? 
          CricketRules.calculateRequiredRunRate(
            currentInning.target,
            currentInning.runs,
            Math.floor(currentInning.oversLimit - currentInning.overs),
            currentInning.balls
          ) : 0,
        currentRunRate: currentInning ? 
          (currentInning.runs / ((currentInning.overs * 6) + currentInning.balls)) * 6 : 0
      };

      res.status(200).json({
        success: true,
        data: {
          match,
          currentInning,
          currentOver,
          availableBatsmen,
          availableBowlers,
          matchSituation
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update batsmen (swap strike, change batsman)
  static async updateBatsmen(req, res, next) {
    try {
      const { inningId } = req.params;
      const { strikerId, nonStrikerId } = req.body;

      const inning = await Inning.findById(inningId);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Validate batsmen are in playing XI and not out
      const battingOrder = inning.playingXI.batting;
      const outBatsmen = inning.fallOfWickets.map(fow => fow.batsman.toString());

      const isValidStriker = battingOrder.some(p => 
        p.player.toString() === strikerId && !outBatsmen.includes(strikerId)
      );
      const isValidNonStriker = battingOrder.some(p => 
        p.player.toString() === nonStrikerId && !outBatsmen.includes(nonStrikerId)
      );

      if (!isValidStriker || !isValidNonStriker) {
        throw new ValidationError('One or both batsmen are not valid');
      }

      // Update batsmen
      inning.currentBatsmen = {
        striker: strikerId,
        nonStriker: nonStrikerId
      };

      await inning.save();

      res.status(200).json({
        success: true,
        message: 'Batsmen updated successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update bowler
  static async updateBowler(req, res, next) {
    try {
      const { inningId } = req.params;
      const { bowlerId } = req.body;

      const inning = await Inning.findById(inningId);
      if (!inning) {
        throw new NotFoundError('Inning not found');
      }

      // Validate bowler is in playing XI
      const isValidBowler = inning.playingXI.bowling.some(p => 
        p.player.toString() === bowlerId
      );

      if (!isValidBowler) {
        throw new ValidationError('Bowler is not in playing XI');
      }

      // Update bowler
      inning.currentBowler = bowlerId;
      await inning.save();

      // Create new bowling stats if needed
      const existingStats = await BowlingStats.findOne({
        player: bowlerId,
        inning: inning._id,
        match: inning.matchId
      });

      if (!existingStats) {
        await BowlingStats.create({
          player: bowlerId,
          match: inning.matchId,
          inning: inning._id,
          team: inning.bowlingTeam,
          startTime: new Date()
        });
      }

      res.status(200).json({
        success: true,
        message: 'Bowler updated successfully',
        data: { inning }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get ball-by-ball commentary
  static async getBallByBall(req, res, next) {
    try {
      const { matchId } = req.params;
      const { inningNumber, limit = 50 } = req.query;

      let inningFilter = { matchId };
      if (inningNumber) {
        inningFilter.inningNumber = parseInt(inningNumber);
      }

      const innings = await Inning.find(inningFilter)
        .select('_id inningNumber')
        .sort({ inningNumber: 1 });

      const ballByBall = [];

      for (const inning of innings) {
        const overs = await Over.find({ inningId: inning._id })
          .sort({ overNumber: 1 })
          .populate('bowler', 'displayName')
          .limit(parseInt(limit));

        for (const over of overs) {
          for (const ball of over.balls) {
            const ballDetails = {
              inning: inning.inningNumber,
              over: over.overNumber,
              ball: ball.ballNumber,
              bowler: over.bowler?.displayName,
              batsman: ball.batsman, // Would need population
              runs: ball.runs,
              extras: ball.extras,
              deliveryType: ball.deliveryType,
              isWicket: ball.isWicket,
              dismissal: ball.dismissal,
              description: ball.description || CricketRules.getBallDescription(
                ball.deliveryType,
                ball.runs,
                ball.extras,
                ball.isWicket,
                ball.dismissal?.type
              ),
              timestamp: ball.timestamp
            };

            ballByBall.push(ballDetails);
          }
        }
      }

      // Sort by timestamp (most recent first)
      ballByBall.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.status(200).json({
        success: true,
        data: {
          ballByBall: ballByBall.slice(0, limit),
          total: ballByBall.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScoringController;