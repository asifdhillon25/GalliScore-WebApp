class CricketRules {
  // Powerplay rules for different formats
  static getPowerplayRules(format) {
    const rules = {
      t20: {
        mandatory: { from: 1, to: 6 },
        optional: []
      },
      odi: {
        mandatory: { from: 1, to: 10 },
        batting: { from: 11, to: 40 },
        bowling: { from: 41, to: 50 }
      },
      test: {
        mandatory: null,
        optional: []
      },
      t10: {
        mandatory: { from: 1, to: 3 },
        optional: []
      },
      the_hundred: {
        mandatory: { from: 1, to: 25 },
        bowling: { from: 26, to: 100 }
      }
    };

    return rules[format] || rules.t20;
  }

  // Maximum overs per bowler based on format
  static getMaxOversPerBowler(format, totalOvers) {
    const rules = {
      t20: 4,
      odi: 10,
      test: Infinity,
      t10: 2,
      the_hundred: 20
    };

    return rules[format] || Math.floor(totalOvers / 5);
  }

  // Follow-on rules for Test matches
  static getFollowOnRules(inningsDifference) {
    return {
      requiredDifference: 200, // Runs
      canEnforce: inningsDifference >= 200,
      isMandatory: false
    };
  }

  // Check if delivery is valid
  static isValidDelivery(deliveryType, extras) {
    const validDeliveryTypes = ['normal', 'bye', 'leg_bye'];
    
    if (!validDeliveryTypes.includes(deliveryType)) {
      return false;
    }

    // Check extras
    if (extras.wides > 1 || extras.noBalls > 1) {
      return false; // Multiple wides/no-balls in one delivery not allowed
    }

    return true;
  }

  // Calculate runs for a ball including extras
  static calculateBallRuns(runs, extras) {
    let totalRuns = runs || 0;
    
    if (extras) {
      totalRuns += (extras.wides || 0);
      totalRuns += (extras.noBalls || 0);
      totalRuns += (extras.byes || 0);
      totalRuns += (extras.legByes || 0);
      totalRuns += (extras.penalty || 0);
    }

    return totalRuns;
  }

  // Check if ball counts towards over
  static countsTowardsOver(deliveryType) {
    const nonCountingDeliveries = ['wide', 'no_ball'];
    return !nonCountingDeliveries.includes(deliveryType);
  }

  // Determine dismissal type validity
  static isValidDismissal(dismissalType, deliveryType) {
    const dismissalRules = {
      bowled: ['normal'],
      caught: ['normal', 'no_ball'],
      lbw: ['normal'],
      run_out: ['normal', 'wide', 'no_ball', 'bye', 'leg_bye'],
      stumped: ['normal', 'wide'],
      hit_wicket: ['normal'],
      hit_twice: ['normal'],
      obstructing_field: ['normal', 'wide', 'no_ball'],
      timed_out: ['normal'],
      handled_ball: ['normal'],
      retired: ['normal', 'wide', 'no_ball'],
      absent: ['normal']
    };

    return dismissalRules[dismissalType]?.includes(deliveryType) || false;
  }

  // Check if boundary is valid
  static isValidBoundary(runs, deliveryType) {
    if (deliveryType === 'wide' || deliveryType === 'no_ball') {
      return false; // Wides and no-balls cannot be boundaries
    }
    
    return runs === 4 || runs === 6;
  }

  // Check if runs are valid for a delivery type
  static isValidRunsForDelivery(runs, deliveryType) {
    if (runs < 0 || runs > 6) {
      return false;
    }

    const deliveryRules = {
      normal: [0, 1, 2, 3, 4, 5, 6],
      wide: [0, 1, 2, 3, 4, 5, 6],
      no_ball: [0, 1, 2, 3, 4, 5, 6],
      bye: [0, 1, 2, 3, 4, 5, 6],
      leg_bye: [0, 1, 2, 3, 4, 5, 6],
      dead_ball: [0]
    };

    return deliveryRules[deliveryType]?.includes(runs) || false;
  }

  // Get field restrictions for powerplay
  static getFieldRestrictions(overNumber, format, powerplayType = 'mandatory') {
    const formatRules = {
      t20: {
        mandatory: {
          from: 1,
          to: 6,
          maxOutsideCircle: 2,
          maxBehindSquare: 2
        },
        death: {
          from: 16,
          to: 20,
          maxOutsideCircle: 5,
          maxBehindSquare: 2
        }
      },
      odi: {
        mandatory: {
          from: 1,
          to: 10,
          maxOutsideCircle: 2,
          maxBehindSquare: 2
        },
        batting: {
          from: 11,
          to: 40,
          maxOutsideCircle: 4,
          maxBehindSquare: 2
        },
        bowling: {
          from: 41,
          to: 50,
          maxOutsideCircle: 5,
          maxBehindSquare: 2
        }
      },
      t10: {
        mandatory: {
          from: 1,
          to: 3,
          maxOutsideCircle: 2,
          maxBehindSquare: 2
        },
        death: {
          from: 7,
          to: 10,
          maxOutsideCircle: 5,
          maxBehindSquare: 2
        }
      }
    };

    const rules = formatRules[format] || formatRules.t20;
    const currentRestriction = Object.values(rules).find(
      rule => overNumber >= rule.from && overNumber <= rule.to
    );

    return currentRestriction || {
      maxOutsideCircle: 5,
      maxBehindSquare: 2
    };
  }

  // Check if ball is a free hit
  static isFreeHit(previousDeliveryType, extras) {
    if (previousDeliveryType === 'no_ball') {
      return true;
    }

    // Check if previous ball had multiple wides/no-balls
    if (extras?.noBalls > 0 || extras?.wides > 1) {
      return true;
    }

    return false;
  }

  // Calculate required run rate
  static calculateRequiredRunRate(targetRuns, currentRuns, oversRemaining, ballsRemaining) {
    if (oversRemaining <= 0 && ballsRemaining <= 0) {
      return Infinity;
    }

    const totalBallsRemaining = (oversRemaining * 6) + ballsRemaining;
    const runsNeeded = targetRuns - currentRuns;

    if (runsNeeded <= 0) return 0;
    if (totalBallsRemaining <= 0) return Infinity;

    return (runsNeeded / totalBallsRemaining) * 6;
  }

  // Calculate net run rate (NRR)
  static calculateNetRunRate(runsScored, oversFaced, runsConceded, oversBowled) {
    const runRateFor = oversFaced > 0 ? runsScored / oversFaced : 0;
    const runRateAgainst = oversBowled > 0 ? runsConceded / oversBowled : 0;

    return runRateFor - runRateAgainst;
  }

  // Check if innings is complete
  static isInningsComplete(wickets, overs, maxWickets, maxOvers) {
    if (wickets >= maxWickets) {
      return { completed: true, reason: 'all_out' };
    }

    if (overs >= maxOvers) {
      return { completed: true, reason: 'overs_complete' };
    }

    return { completed: false, reason: null };
  }

  // Get DRS (Decision Review System) rules
  static getDRSRules(format) {
    const rules = {
      t20: {
        reviewsPerInning: 2,
        umpiresCallRetained: true,
        lostReviewOnUmpiresCall: false,
        timeout: 15 // seconds
      },
      odi: {
        reviewsPerInning: 2,
        umpiresCallRetained: true,
        lostReviewOnUmpiresCall: false,
        timeout: 15
      },
      test: {
        reviewsPerInning: 3,
        umpiresCallRetained: true,
        lostReviewOnUmpiresCall: false,
        timeout: 15
      },
      t10: {
        reviewsPerInning: 1,
        umpiresCallRetained: true,
        lostReviewOnUmpiresCall: true,
        timeout: 10
      }
    };

    return rules[format] || rules.t20;
  }

  // Check if match result can be determined
  static canDetermineResult(inning1Score, inning1Wickets, inning2Score, inning2Wickets, target, format) {
    // Test match specific rules
    if (format === 'test') {
      // Innings lead check
      if (inning1Score > inning2Score) {
        const lead = inning1Score - inning2Score;
        if (lead >= 200) {
          return { canEnforceFollowOn: true, result: null };
        }
      }
    }

    // Limited overs matches
    if (target > 0) {
      if (inning2Score >= target) {
        return { result: 'chasing_team_wins', margin: `${target - inning2Score} wickets` };
      }

      // Check if all out before reaching target
      if (inning2Wickets >= 10 && inning2Score < target) {
        return { result: 'defending_team_wins', margin: `${target - inning2Score - 1} runs` };
      }

      // Check if overs completed without reaching target
      if (inning2Score < target) {
        return { result: 'defending_team_wins', margin: `${target - inning2Score - 1} runs` };
      }
    }

    return { result: null, details: 'match_in_progress' };
  }

  // Calculate partnership run rate
  static calculatePartnershipRunRate(runs, balls) {
    if (balls === 0) return 0;
    return (runs / balls) * 100;
  }

  // Check if bowler can change ends
  static canBowlerChangeEnds(previousBowler, currentBowler, oversBowledByCurrent) {
    // Bowler cannot bowl consecutive overs from same end
    if (previousBowler === currentBowler) {
      return false;
    }

    // Minimum overs before changing ends (usually 1 over)
    if (oversBowledByCurrent < 1) {
      return false;
    }

    return true;
  }

  // Calculate economy rate
  static calculateEconomyRate(runs, overs) {
    if (overs === 0) return 0;
    return runs / overs;
  }

  // Calculate batting average
  static calculateBattingAverage(runs, innings, notOuts) {
    const dismissals = innings - notOuts;
    if (dismissals === 0) return runs; // Average = runs if never dismissed
    return runs / dismissals;
  }

  // Calculate bowling average
  static calculateBowlingAverage(runs, wickets) {
    if (wickets === 0) return 0;
    return runs / wickets;
  }

  // Calculate bowling strike rate
  static calculateBowlingStrikeRate(balls, wickets) {
    if (wickets === 0) return 0;
    return balls / wickets;
  }

  // Check if super over is required
  static isSuperOverRequired(team1Score, team2Score, format) {
    if (format === 't20' || format === 'odi' || format === 't10') {
      return team1Score === team2Score;
    }
    return false;
  }

  // Get super over rules
  static getSuperOverRules(format) {
    const rules = {
      t20: {
        overs: 1,
        wickets: 2,
        bowlersPerTeam: 1,
        batsmenPerTeam: 2
      },
      odi: {
        overs: 1,
        wickets: 2,
        bowlersPerTeam: 1,
        batsmenPerTeam: 2
      },
      t10: {
        overs: 1,
        wickets: 2,
        bowlersPerTeam: 1,
        batsmenPerTeam: 2
      }
    };

    return rules[format] || rules.t20;
  }

  // Calculate Duckworth-Lewis-Stern (DLS) par score
  static calculateDLSParScore(resourcesUsed, target, resourcesRemaining) {
    // Simplified DLS calculation
    // In real implementation, use official DLS tables
    const parScore = target * (resourcesRemaining / resourcesUsed);
    return Math.floor(parScore);
  }

  // Check if ball is a legal delivery
  static isLegalDelivery(deliveryType, extras) {
    const illegalDeliveries = ['no_ball', 'dead_ball'];
    
    if (illegalDeliveries.includes(deliveryType)) {
      return false;
    }

    // Check for illegal extras
    if (extras?.wides > 2 || extras?.noBalls > 1) {
      return false;
    }

    return true;
  }

  // Get ball description based on delivery
  static getBallDescription(deliveryType, runs, extras, isWicket, dismissalType) {
    let description = '';

    if (deliveryType === 'wide') {
      description = `Wide ${extras?.wides > 1 ? `(${extras.wides})` : ''}`;
    } else if (deliveryType === 'no_ball') {
      description = `No ball`;
      if (runs > 0) {
        description += ` + ${runs} run${runs > 1 ? 's' : ''}`;
      }
    } else if (deliveryType === 'bye') {
      description = `${runs} bye${runs !== 1 ? 's' : ''}`;
    } else if (deliveryType === 'leg_bye') {
      description = `${runs} leg bye${runs !== 1 ? 's' : ''}`;
    } else {
      description = `${runs} run${runs !== 1 ? 's' : ''}`;
    }

    if (isWicket) {
      description += `, ${this.getDismissalDescription(dismissalType)}`;
    }

    if (runs === 4) description += ', FOUR!';
    if (runs === 6) description += ', SIX!';

    return description.trim();
  }

  // Get dismissal description
  static getDismissalDescription(dismissalType) {
    const descriptions = {
      bowled: 'Bowled',
      caught: 'Caught',
      lbw: 'LBW',
      run_out: 'Run out',
      stumped: 'Stumped',
      hit_wicket: 'Hit wicket',
      hit_twice: 'Hit the ball twice',
      obstructing_field: 'Obstructing the field',
      timed_out: 'Timed out',
      handled_ball: 'Handled the ball',
      retired: 'Retired',
      absent: 'Absent'
    };

    return descriptions[dismissalType] || 'Out';
  }

  // Check if team can declare innings (Test matches)
  static canDeclareInnings(oversBowled, wicketsLost, format) {
    if (format !== 'test') return false;
    
    // Minimum overs before declaration
    if (oversBowled < 60) return false;
    
    // Can't declare with 0 wickets lost in first innings
    if (wicketsLost === 0) return false;

    return true;
  }

  // Calculate required run rate for DLS scenarios
  static calculateDLSRequiredRunRate(target, resourcesUsed, resourcesRemaining, ballsRemaining) {
    const parScore = this.calculateDLSParScore(resourcesUsed, target, resourcesRemaining);
    const runsNeeded = parScore;
    
    if (ballsRemaining <= 0) return Infinity;
    return (runsNeeded / ballsRemaining) * 6;
  }

  // Get match result based on scores
  static getMatchResult(team1Score, team1Wickets, team2Score, team2Wickets, target, format) {
    if (format === 'test') {
      if (team1Score > team2Score) {
        const lead = team1Score - team2Score;
        return `Team 1 wins by ${lead} runs`;
      } else if (team2Score > team1Score) {
        const wicketsRemaining = 10 - team2Wickets;
        return `Team 2 wins by ${wicketsRemaining} wickets`;
      }
    } else {
      if (team2Score >= target) {
        const wicketsRemaining = 10 - team2Wickets;
        return `Team 2 wins by ${wicketsRemaining} wickets`;
      } else {
        const margin = target - team2Score - 1;
        return `Team 1 wins by ${margin} runs`;
      }
    }

    return 'Match drawn';
  }

  // Validate match configuration
  static validateMatchConfig(format, overs, wickets, powerplayOvers) {
    const errors = [];

    const formatConfigs = {
      t20: { minOvers: 5, maxOvers: 20, minWickets: 5, maxWickets: 10 },
      odi: { minOvers: 20, maxOvers: 50, minWickets: 5, maxWickets: 10 },
      test: { minOvers: 50, maxOvers: 450, minWickets: 5, maxWickets: 10 },
      t10: { minOvers: 5, maxOvers: 10, minWickets: 5, maxWickets: 10 },
      the_hundred: { minOvers: 20, maxOvers: 100, minWickets: 5, maxWickets: 10 }
    };

    const config = formatConfigs[format] || formatConfigs.t20;

    if (overs < config.minOvers || overs > config.maxOvers) {
      errors.push(`Overs must be between ${config.minOvers} and ${config.maxOvers} for ${format}`);
    }

    if (wickets < config.minWickets || wickets > config.maxWickets) {
      errors.push(`Wickets must be between ${config.minWickets} and ${config.maxWickets}`);
    }

    if (powerplayOvers > overs) {
      errors.push('Powerplay overs cannot exceed total overs');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CricketRules;