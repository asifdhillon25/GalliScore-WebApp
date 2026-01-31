const mongoose = require('mongoose');

const bowlingStatsSchema = new mongoose.Schema({
  // Reference Information
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Player is required']
  },
  
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match is required']
  },
  
  inning: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inning',
    required: [true, 'Inning is required']
  },
  
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team is required']
  },
  
  // Bowling Details
  overs: {
    type: Number,
    default: 0,
    min: [0, 'Overs cannot be negative']
  },
  
  balls: {
    type: Number,
    default: 0,
    min: [0, 'Balls cannot be negative'],
    max: [5, 'Balls cannot exceed 5']
  },
  
  // Performance Metrics
  runs: {
    type: Number,
    default: 0,
    min: [0, 'Runs cannot be negative']
  },
  
  wickets: {
    type: Number,
    default: 0,
    min: [0, 'Wickets cannot be negative']
  },
  
  maidens: {
    type: Number,
    default: 0,
    min: [0, 'Maidens cannot be negative']
  },
  
  // Extras Breakdown
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Dismissal Details
  dismissals: [{
    batsman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    dismissal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dismissal'
    },
    fielder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: Number,
    balls: Number
  }],
  
  // Bowling Analysis
  dotBalls: {
    type: Number,
    default: 0,
    min: [0, 'Dot balls cannot be negative']
  },
  
  boundariesConceded: {
    type: Number,
    default: 0,
    min: [0, 'Boundaries cannot be negative']
  },
  
  sixesConceded: {
    type: Number,
    default: 0,
    min: [0, 'Sixes cannot be negative']
  },
  
  // Bowling Types
  bowlingType: {
    type: String,
    enum: ['fast', 'medium', 'spin', 'mystery']
  },
  
  bowlingArm: {
    type: String,
    enum: ['right', 'left']
  },
  
  // Spell Information
  spells: [{
    spellNumber: Number,
    overs: Number,
    runs: Number,
    wickets: Number,
    startOver: Number,
    endOver: Number
  }],
  
  // Powerplay Performance
  powerplayOvers: {
    type: Number,
    default: 0
  },
  
  powerplayRuns: {
    type: Number,
    default: 0
  },
  
  powerplayWickets: {
    type: Number,
    default: 0
  },
  
  // Death Overs Performance
  deathOvers: {
    type: Number,
    default: 0
  },
  
  deathOversRuns: {
    type: Number,
    default: 0
  },
  
  deathOversWickets: {
    type: Number,
    default: 0
  },
  
  // Bowling Stats
  economy: {
    type: Number,
    default: 0
  },
  
  average: {
    type: Number,
    default: 0
  },
  
  strikeRate: {
    type: Number,
    default: 0
  },
  
  // Bowling Accuracy
  lineLength: {
    good: { type: Number, default: 0 },
    full: { type: Number, default: 0 },
    short: { type: Number, default: 0 },
    wide: { type: Number, default: 0 }
  },
  
  // Milestones
  milestones: [{
    type: String,
    enum: ['three_wickets', 'four_wickets', 'five_wickets', 'hat_trick']
  }],
  
  // DRS Information
  drsReviews: {
    for: { type: Number, default: 0 },
    against: { type: Number, default: 0 },
    successful: { type: Number, default: 0 }
  },
  
  // Match Situation
  matchSituation: {
    whenStarted: {
      runs: Number,
      wickets: Number,
      overs: Number,
      balls: Number
    },
    
    whenFinished: {
      runs: Number,
      wickets: Number,
      overs: Number,
      balls: Number
    }
  },
  
  // Time Tracking
  startTime: {
    type: Date
  },
  
  endTime: {
    type: Date
  },
  
  duration: {
    type: Number, // in minutes
    default: 0
  },
  
  // Additional Info
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Bowling Variations
  variations: [{
    type: String,
    enum: ['outswinger', 'inswinger', 'off_cutter', 'leg_cutter', 
           'slower_ball', 'yorker', 'bouncer', 'googly', 
           'doosra', 'carrom_ball', 'teesra']
  }],
  
  // Scorer Information
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Scorer is required']
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bowlingStatsSchema.index({ player: 1, match: 1 });
bowlingStatsSchema.index({ match: 1, inning: 1 });
bowlingStatsSchema.index({ team: 1 });
bowlingStatsSchema.index({ wickets: -1 });
bowlingStatsSchema.index({ economy: 1 }); // Lower is better
bowlingStatsSchema.index({ 'milestones': 1 });

// Virtuals
bowlingStatsSchema.virtual('totalBalls').get(function() {
  return (this.overs * 6) + this.balls;
});

bowlingStatsSchema.virtual('dotBallPercentage').get(function() {
  if (this.totalBalls === 0) return 0;
  return (this.dotBalls / this.totalBalls) * 100;
});

bowlingStatsSchema.virtual('boundaryPercentage').get(function() {
  if (this.totalBalls === 0) return 0;
  return (this.boundariesConceded / this.totalBalls) * 100;
});

bowlingStatsSchema.virtual('runsPerBall').get(function() {
  if (this.totalBalls === 0) return 0;
  return this.runs / this.totalBalls;
});

bowlingStatsSchema.virtual('wicketsPerOver').get(function() {
  if (this.overs === 0) return 0;
  return this.wickets / this.overs;
});

// Methods
bowlingStatsSchema.methods.updateStats = function() {
  // Calculate economy rate
  const totalOvers = this.overs + (this.balls / 6);
  this.economy = totalOvers > 0 ? this.runs / totalOvers : 0;
  
  // Calculate average
  this.average = this.wickets > 0 ? this.runs / this.wickets : 0;
  
  // Calculate strike rate
  this.strikeRate = this.wickets > 0 ? this.totalBalls / this.wickets : 0;
  
  // Calculate extras total
  this.extras.total = this.extras.wides + this.extras.noBalls + 
                     this.extras.byes + this.extras.legByes + 
                     this.extras.penalty;
  
  // Check for milestones
  this.milestones = [];
  if (this.wickets >= 3) this.milestones.push('three_wickets');
  if (this.wickets >= 4) this.milestones.push('four_wickets');
  if (this.wickets >= 5) this.milestones.push('five_wickets');
  
  // Check for hat-trick (would need to track sequence of wickets)
  // This would be calculated separately based on ball-by-ball data
  
  return this;
};

bowlingStatsSchema.methods.addBall = function(runs, isWicket, extras = {}, isBoundary = false, isDotBall = false) {
  // Update balls/overs
  this.balls += 1;
  if (this.balls >= 6) {
    this.overs += 1;
    this.balls = 0;
    
    // Check for maiden
    const lastOverRuns = this.getLastOverRuns(); // This would need implementation
    if (lastOverRuns === 0) {
      this.maidens += 1;
    }
  }
  
  // Update runs
  this.runs += runs;
  
  // Update wickets
  if (isWicket) {
    this.wickets += 1;
  }
  
  // Update extras
  if (extras.wides) this.extras.wides += extras.wides;
  if (extras.noBalls) this.extras.noBalls += extras.noBalls;
  if (extras.byes) this.extras.byes += extras.byes;
  if (extras.legByes) this.extras.legByes += extras.legByes;
  if (extras.penalty) this.extras.penalty += extras.penalty;
  
  // Update boundaries
  if (isBoundary) {
    this.boundariesConceded += 1;
    if (runs === 6) this.sixesConceded += 1;
  }
  
  // Update dot balls
  if (isDotBall) {
    this.dotBalls += 1;
  }
  
  this.updateStats();
  return this.save();
};

bowlingStatsSchema.methods.addWicket = function(batsmanId, dismissalId, fielderId, runs, balls) {
  this.dismissals.push({
    batsman: batsmanId,
    dismissal: dismissalId,
    fielder: fielderId,
    runs,
    balls
  });
  
  return this.save();
};

// Pre-save middleware
bowlingStatsSchema.pre('save', function(next) {
  this.updateStats();
  next();
});

const BowlingStats = mongoose.model('BowlingStats', bowlingStatsSchema);

module.exports = BowlingStats;