const Tournament = require('../models/Tournament.model');
const Match = require('../models/Match.model');
const Team = require('../models/Team.model');
const { 
  AppError, 
  NotFoundError, 
  ValidationError 
} = require('../middleware/error.middleware');

const tournamentController = {
  // Create a new tournament
  createTournament: async (req, res, next) => {
    try {
      const tournamentData = req.body;
      const userId = req.user._id;

      // Check if tournament name already exists
      const existingTournament = await Tournament.findOne({ 
        name: tournamentData.name 
      });

      if (existingTournament) {
        throw new ValidationError('Tournament with this name already exists');
      }

      // Create tournament
      const tournament = await Tournament.create({
        ...tournamentData,
        organizedBy: userId,
        organizers: [{
          user: userId,
          role: 'tournament_director'
        }],
        status: 'upcoming'
      });

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: { tournament }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all tournaments
  getAllTournaments: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        format, 
        season,
        type,
        search,
        sortBy = 'startDate',
        sortOrder = 'desc'
      } = req.query;
      
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Build filter
      const filter = {};
      
      if (status) filter.status = status;
      if (format) filter.format = format;
      if (season) filter.season = season;
      if (type) filter.type = type;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { shortName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Only show public tournaments or tournaments user is part of
      if (req.user.role !== 'admin') {
        filter.$or = [
          { visibility: 'public' },
          { organizedBy: req.user._id },
          { 'organizers.user': req.user._id }
        ];
      }

      // Get tournaments
      const tournaments = await Tournament.find(filter)
        .populate('teams.team', 'name shortName logo')
        .populate('organizedBy', 'username firstName lastName')
        .populate('venues', 'name city')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Tournament.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          tournaments,
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

  // Get tournament by ID
  getTournamentById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const tournament = await Tournament.findById(id)
        .populate('teams.team', 'name shortName logo city type')
        .populate('groups.teams', 'name shortName logo')
        .populate('venues', 'name city address facilities')
        .populate('officials.scorers', 'username firstName lastName')
        .populate('winners.champion', 'name shortName logo')
        .populate('winners.runnerUp', 'name shortName logo')
        .populate('winners.thirdPlace', 'name shortName logo')
        .populate('statistics.mostRuns.player', 'displayName firstName lastName')
        .populate('statistics.mostWickets.player', 'displayName firstName lastName')
        .populate('organizedBy', 'username firstName lastName profileImage')
        .populate('organizers.user', 'username firstName lastName');

      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check access permissions
      if (tournament.visibility === 'private' && 
          !tournament.inviteCode && 
          req.user.role !== 'admin' &&
          tournament.organizedBy._id.toString() !== req.user._id.toString() &&
          !tournament.organizers.some(org => org.user._id.toString() === req.user._id.toString())) {
        throw new ValidationError('You do not have access to this tournament');
      }

      // Get tournament matches
      const matches = await Match.find({ tournament: id })
        .populate('team1', 'name shortName logo')
        .populate('team2', 'name shortName logo')
        .populate('venue', 'name city')
        .sort({ date: 1 });

      // Calculate current standings
      const standings = await this.calculateStandings(tournament);

      res.status(200).json({
        success: true,
        data: {
          tournament,
          matches,
          standings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update tournament
  updateTournament: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin' &&
          !tournament.organizers.some(org => org.user.toString() === userId.toString())) {
        throw new ValidationError('You do not have permission to update this tournament');
      }

      // Check if name is being updated and if it already exists
      if (updateData.name && updateData.name !== tournament.name) {
        const existingTournament = await Tournament.findOne({
          name: updateData.name,
          _id: { $ne: id }
        });

        if (existingTournament) {
          throw new ValidationError('Tournament with this name already exists');
        }
      }

      const updatedTournament = await Tournament.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Tournament updated successfully',
        data: { tournament: updatedTournament }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete tournament
  deleteTournament: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin') {
        throw new ValidationError('Only tournament organizer or admin can delete tournament');
      }

      // Can't delete if tournament has started
      if (tournament.status !== 'upcoming') {
        throw new ValidationError('Cannot delete tournament that has already started');
      }

      await Tournament.findByIdAndDelete(id);

      // Also delete associated matches
      await Match.deleteMany({ tournament: id });

      res.status(200).json({
        success: true,
        message: 'Tournament deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Add team to tournament
  addTeamToTournament: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { teamId, group, seeding } = req.body;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin' &&
          !tournament.organizers.some(org => org.user.toString() === userId.toString())) {
        throw new ValidationError('You do not have permission to add teams to this tournament');
      }

      // Check if tournament registration is open
      if (!tournament.registration.open || 
          (tournament.registrationDeadline && new Date() > tournament.registrationDeadline)) {
        throw new ValidationError('Tournament registration is closed');
      }

      // Check max teams limit
      if (tournament.registration.maxTeams && 
          tournament.teams.length >= tournament.registration.maxTeams) {
        throw new ValidationError('Tournament has reached maximum teams limit');
      }

      // Check if team is already registered
      const existingTeam = tournament.teams.find(t => 
        t.team.toString() === teamId
      );

      if (existingTeam) {
        throw new ValidationError('Team is already registered in this tournament');
      }

      // Add team
      await tournament.addTeam(teamId, group, seeding);
      await tournament.save();

      res.status(200).json({
        success: true,
        message: 'Team added to tournament successfully',
        data: { tournament }
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove team from tournament
  removeTeamFromTournament: async (req, res, next) => {
    try {
      const { id, teamId } = req.params;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin') {
        throw new ValidationError('You do not have permission to remove teams from this tournament');
      }

      // Check if tournament has started
      if (tournament.status !== 'upcoming') {
        throw new ValidationError('Cannot remove teams after tournament has started');
      }

      await tournament.removeTeam(teamId);
      await tournament.save();

      res.status(200).json({
        success: true,
        message: 'Team removed from tournament successfully',
        data: { tournament }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update tournament standings
  updateStandings: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin' &&
          !tournament.organizers.some(org => org.user.toString() === userId.toString())) {
        throw new ValidationError('You do not have permission to update standings');
      }

      // Recalculate standings
      await tournament.updateStandings();
      const updatedTournament = await Tournament.findById(id);

      res.status(200).json({
        success: true,
        message: 'Standings updated successfully',
        data: { 
          standings: updatedTournament.standings,
          statistics: updatedTournament.statistics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate tournament schedule
  generateSchedule: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startDate, matchDuration = 210, daysBetweenRounds = 1 } = req.body;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id)
        .populate('teams.team', 'name shortName')
        .populate('venues', 'name');
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin') {
        throw new ValidationError('You do not have permission to generate schedule');
      }

      // Check if tournament has teams
      if (tournament.teams.length < 2) {
        throw new ValidationError('Tournament needs at least 2 teams to generate schedule');
      }

      // Generate matches based on tournament type
      const schedule = await this.generateTournamentSchedule(
        tournament,
        new Date(startDate),
        matchDuration,
        daysBetweenRounds
      );

      // Create matches in database
      const createdMatches = [];
      for (const matchData of schedule) {
        const match = await Match.create({
          ...matchData,
          tournament: id,
          createdBy: userId,
          status: 'scheduled'
        });
        createdMatches.push(match);
      }

      // Update tournament structure
      tournament.structure.totalMatches = createdMatches.length;
      tournament.structure.groupMatches = createdMatches.filter(m => !m.round).length;
      tournament.structure.knockoutMatches = createdMatches.filter(m => m.round).length;
      tournament.schedule = schedule; // Store the schedule
      await tournament.save();

      res.status(200).json({
        success: true,
        message: 'Tournament schedule generated successfully',
        data: {
          matches: createdMatches,
          schedule,
          totalMatches: createdMatches.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Helper: Generate tournament schedule
  generateTournamentSchedule: async (tournament, startDate, matchDuration, daysBetweenRounds) => {
    const schedule = [];
    let currentDate = new Date(startDate);
    const teams = tournament.teams.map(t => t.team);
    const venues = tournament.venues;

    // Round-robin stage
    if (tournament.type === 'round_robin' || tournament.type === 'group_knockout') {
      // Generate round-robin matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const venue = venues[Math.floor(Math.random() * venues.length)];
          
          schedule.push({
            title: `${teams[i].name} vs ${teams[j].name}`,
            team1: teams[i]._id,
            team2: teams[j]._id,
            date: currentDate,
            venue: venue?._id,
            format: tournament.format,
            group: 'Group Stage'
          });

          // Add return match for double round-robin
          if (tournament.type === 'round_robin') {
            schedule.push({
              title: `${teams[j].name} vs ${teams[i].name}`,
              team1: teams[j]._id,
              team2: teams[i]._id,
              date: new Date(currentDate.getTime() + (matchDuration * 60000)),
              venue: venue?._id,
              format: tournament.format,
              group: 'Group Stage'
            });
          }

          currentDate = new Date(currentDate.getTime() + (matchDuration * 60000 * 2));
        }
        // Add day break between rounds
        currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
      }
    }

    // Knockout stage
    if (tournament.type === 'knockout' || tournament.type === 'group_knockout') {
      // This is simplified - actual implementation would be more complex
      const knockoutTeams = teams.slice(0, 8); // Top 8 teams
      
      // Quarter-finals
      for (let i = 0; i < knockoutTeams.length; i += 2) {
        const venue = venues[Math.floor(Math.random() * venues.length)];
        
        schedule.push({
          title: `Quarter-final: ${knockoutTeams[i].name} vs ${knockoutTeams[i + 1].name}`,
          team1: knockoutTeams[i]._id,
          team2: knockoutTeams[i + 1]._id,
          date: currentDate,
          venue: venue?._id,
          format: tournament.format,
          round: 'quarter_final'
        });

        currentDate = new Date(currentDate.getTime() + (matchDuration * 60000));
      }

      currentDate.setDate(currentDate.getDate() + daysBetweenRounds);

      // Semi-finals (simplified)
      // This would actually depend on quarter-final results
    }

    return schedule;
  },

  // Helper: Calculate tournament standings
  calculateStandings: async (tournament) => {
    const matches = await Match.find({ 
      tournament: tournament._id,
      status: 'completed'
    });

    const standings = tournament.teams.map(teamEntry => {
      const teamId = teamEntry.team._id || teamEntry.team;
      const teamMatches = matches.filter(match => 
        match.team1.toString() === teamId.toString() || 
        match.team2.toString() === teamId.toString()
      );

      let wins = 0;
      let losses = 0;
      let draws = 0;
      let ties = 0;
      let noResults = 0;
      let runsFor = 0;
      let runsAgainst = 0;
      let wicketsFor = 0;
      let wicketsAgainst = 0;
      let oversFor = 0;
      let oversAgainst = 0;

      teamMatches.forEach(match => {
        const isTeam1 = match.team1.toString() === teamId.toString();
        
        // Get inning data (simplified)
        if (match.innings && match.innings.length > 0) {
          match.innings.forEach(inning => {
            if ((isTeam1 && inning.battingTeam.toString() === teamId.toString()) ||
                (!isTeam1 && inning.bowlingTeam.toString() === teamId.toString())) {
              runsFor += inning.runs || 0;
              wicketsFor += inning.wickets || 0;
              oversFor += inning.overs || 0;
            } else {
              runsAgainst += inning.runs || 0;
              wicketsAgainst += inning.wickets || 0;
              oversAgainst += inning.overs || 0;
            }
          });
        }

        // Count results
        if (match.result === 'team1_win') {
          if (isTeam1) wins++;
          else losses++;
        } else if (match.result === 'team2_win') {
          if (!isTeam1) wins++;
          else losses++;
        } else if (match.result === 'draw') {
          draws++;
        } else if (match.result === 'tie') {
          ties++;
        } else if (match.result === 'no_result') {
          noResults++;
        }
      });

      const played = wins + losses + draws + ties + noResults;
      const points = (wins * tournament.rules.pointsSystem.win) +
                    (draws * tournament.rules.pointsSystem.draw) +
                    (ties * tournament.rules.pointsSystem.tie) +
                    (noResults * tournament.rules.pointsSystem.noResult);

      // Calculate Net Run Rate
      const nrr = tournament.rules.netRunRate ? 
        CricketRules.calculateNetRunRate(runsFor, oversFor, runsAgainst, oversAgainst) : 0;

      return {
        team: teamEntry.team,
        group: teamEntry.group,
        seeding: teamEntry.seeding,
        matches: {
          played,
          won: wins,
          lost: losses,
          drawn: draws,
          tied: ties,
          noResult: noResults
        },
        points,
        netRunRate: nrr,
        runs: { for: runsFor, against: runsAgainst },
        wickets: { for: wicketsFor, against: wicketsAgainst },
        overs: { for: oversFor, against: oversAgainst }
      };
    });

    // Sort standings
    standings.sort((a, b) => {
      // Sort by points
      if (b.points !== a.points) return b.points - a.points;
      
      // Sort by net run rate
      if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
      
      // Sort by wins
      if (b.matches.won !== a.matches.won) return b.matches.won - a.matches.won;
      
      // Sort by head-to-head (would need additional logic)
      return 0;
    });

    return standings;
  },

  // Get tournament statistics
  getTournamentStats: async (req, res, next) => {
    try {
      const { id } = req.params;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Get all tournament matches
      const matches = await Match.find({ tournament: id })
        .populate('innings')
        .populate('team1', 'name shortName')
        .populate('team2', 'name shortName');

      // Calculate statistics
      const stats = {
        totalMatches: matches.length,
        completedMatches: matches.filter(m => m.status === 'completed').length,
        totalRuns: 0,
        totalWickets: 0,
        totalFours: 0,
        totalSixes: 0,
        highestScore: { score: 0, team: null, match: null },
        lowestScore: { score: Infinity, team: null, match: null },
        bestBowling: { wickets: 0, runs: 0, player: null, match: null },
        mostRuns: { player: null, runs: 0 },
        mostWickets: { player: null, wickets: 0 },
        averageScore: 0,
        averageWickets: 0
      };

      // Aggregate match data
      matches.forEach(match => {
        if (match.innings && match.innings.length > 0) {
          match.innings.forEach(inning => {
            stats.totalRuns += inning.runs || 0;
            stats.totalWickets += inning.wickets || 0;

            // Track highest/lowest scores
            if (inning.runs > stats.highestScore.score) {
              stats.highestScore = {
                score: inning.runs,
                team: inning.battingTeam,
                match: match._id
              };
            }
            if (inning.runs < stats.lowestScore.score) {
              stats.lowestScore = {
                score: inning.runs,
                team: inning.battingTeam,
                match: match._id
              };
            }
          });
        }
      });

      // Calculate averages
      const completedInnings = matches.reduce((total, match) => 
        total + (match.innings ? match.innings.length : 0), 0);
      
      stats.averageScore = completedInnings > 0 ? stats.totalRuns / completedInnings : 0;
      stats.averageWickets = completedInnings > 0 ? stats.totalWickets / completedInnings : 0;

      // Get player statistics
      const battingStats = await this.getTournamentBattingStats(id);
      const bowlingStats = await this.getTournamentBowlingStats(id);

      if (battingStats.length > 0) {
        stats.mostRuns = battingStats[0];
      }
      if (bowlingStats.length > 0) {
        stats.mostWickets = bowlingStats[0];
        // Find best bowling figures
        bowlingStats.forEach(bowler => {
          if (bowler.wickets > stats.bestBowling.wickets ||
              (bowler.wickets === stats.bestBowling.wickets && bowler.runs < stats.bestBowling.runs)) {
            stats.bestBowling = {
              wickets: bowler.wickets,
              runs: bowler.runs,
              player: bowler.player,
              match: bowler.bestMatch
            };
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get tournament batting statistics
  getTournamentBattingStats: async (tournamentId) => {
    // This would aggregate batting stats from all matches in the tournament
    // For now, return placeholder
    return [];
  },

  // Get tournament bowling statistics
  getTournamentBowlingStats: async (tournamentId) => {
    // This would aggregate bowling stats from all matches in the tournament
    // For now, return placeholder
    return [];
  },

  // Generate invite code for private tournament
  generateInviteCode: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const tournament = await Tournament.findById(id);
      
      if (!tournament) {
        throw new NotFoundError('Tournament not found');
      }

      // Check permissions
      if (tournament.organizedBy.toString() !== userId.toString() && 
          req.user.role !== 'admin') {
        throw new ValidationError('Only tournament organizer can generate invite codes');
      }

      await tournament.generateInviteCode();
      await tournament.save();

      res.status(200).json({
        success: true,
        message: 'Invite code generated successfully',
        data: {
          inviteCode: tournament.inviteCode,
          inviteLink: `${process.env.CLIENT_URL}/tournament/join/${tournament.inviteCode}`
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Join tournament using invite code
  joinTournament: async (req, res, next) => {
    try {
      const { inviteCode } = req.params;
      const { teamId } = req.body;
      const userId = req.user._id;

      const tournament = await Tournament.findOne({ inviteCode });
      
      if (!tournament) {
        throw new NotFoundError('Invalid invite code');
      }

      // Check if tournament registration is open
      if (!tournament.registration.open || 
          (tournament.registrationDeadline && new Date() > tournament.registrationDeadline)) {
        throw new ValidationError('Tournament registration is closed');
      }

      // Check max teams limit
      if (tournament.registration.maxTeams && 
          tournament.teams.length >= tournament.registration.maxTeams) {
        throw new ValidationError('Tournament has reached maximum teams limit');
      }

      // Check if team is already registered
      const existingTeam = tournament.teams.find(t => 
        t.team.toString() === teamId
      );

      if (existingTeam) {
        throw new ValidationError('Team is already registered in this tournament');
      }

      // Add team
      await tournament.addTeam(teamId);
      await tournament.save();

      res.status(200).json({
        success: true,
        message: 'Team joined tournament successfully',
        data: { tournament }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = tournamentController;