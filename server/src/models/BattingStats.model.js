const mongoose = require('mongoose');

const battingStatsSchema = new mongoose.Schema({
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
  
  // Inning Details
  inningNumber: {
    type: Number,
    required: [true, 'Inning number is required']
  },
  
  battingPosition: {
    type: Number,
    required: [true, 'Batting position is required']
  },
  
  // Status
  isNotOut: {
    type: Boolean,
    default: false
  },
  
  // Scoring Details
  runs: {
    type: Number,
    default: 0,
    min: [0, 'Runs cannot be negative']
  },
  
  ballsFaced: {
    type: Number,
    default: 0,
    min: [0, 'Balls faced cannot be negative']
  },
  
  minutes: {
    type: Number,
    default: 0,
    min: [0, 'Minutes cannot be negative']
  },
  
  // Boundary Details
  fours: {
    type: Number,
    default: 0,
    min: [0, 'Fours cannot be negative']
  },
  
  sixes: {
    type: Number,
    default: 0,
    min: [0, 'Sixes cannot be negative']
  },
  
  // Dismissal Details
  dismissal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dismissal'
  },
  
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Partnership Details
  partnerships: [{
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: Number,
    balls: Number
  }],
  
  // Timing & Scoring Pattern
  dotBalls: {
    type: Number,
    default: 0,
    min: [0, 'Dot balls cannot be negative']
  },
  
  scoringShots: {
    type: Number,
    default: 0,
    min: [0, 'Scoring shots cannot be negative']
  },
  
  scoringZones: {
    offSide: { type: Number, default: 0 },
    legSide: { type: Number, default: 0 },
    straight: { type: Number, default: 0 }
  },
  
  // Powerplay Performance
  powerplayRuns: {
    type: Number,
    default: 0,
    min: [0, 'Powerplay runs cannot be negative']
  },
  
  powerplayBalls: {
    type: Number,
    default: 0,
    min: [0, 'Powerplay balls cannot be negative']
  },
  
  // Death Overs Performance
  deathOversRuns: {
    type: Number,
    default: 0,
    min: [0, 'Death overs runs cannot be negative']
  },
  
  deathOversBalls: {
    type: Number,
    default: 0,
    min: [0, 'Death overs balls cannot be negative']
  },
  
  // Milestones
  milestones: [{
    type: String,
    enum: ['half_century', 'century', 'double_century', 'triple_century']
  }],
  
  // Batting Stats
  strikeRate: {
    type: Number,
    default: 0
  },
  
  average: {
    type: Number,
    default: 0
  },
  
  // DRS Information
  reviews: [{
    type: String,
    enum: ['reviewed_out', 'reviewed_not_out', 'reviewed_umpires_call']
  }],
  
  // Match Situation
  matchSituation: {
    whenEntered: {
      runs: Number,
      wickets: Number,
      overs: Number,
      balls: Number
    },
    
    whenDismissed: {
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
  
  // Performance Metrics
  controlPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Control percentage cannot be negative'],
    max: [100, 'Control percentage cannot exceed 100']
  },
  
  falseShots: {
    type: Number,
    default: 0,
    min: [0, 'False shots cannot be negative']
  },
  
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
battingStatsSchema.index({ player: 1, match: 1 });
battingStatsSchema.index({ match: 1, inning: 1 });
battingStatsSchema.index({ team: 1 });
battingStatsSchema.index({ runs: -1 });
battingStatsSchema.index({ strikeRate: -1 });
battingStatsSchema.index({ 'milestones': 1 });

// Virtuals
battingStatsSchema.virtual('boundaryRuns').get(function() {
  return (this.fours * 4) + (this.sixes * 6);
});

battingStatsSchema.virtual('boundaryPercentage').get(function() {
  if (this.runs === 0) return 0;
  return (this.boundaryRuns / this.runs) * 100;
});

battingStatsSchema.virtual('dotBallPercentage').get(function() {
  if (this.ballsFaced === 0) return 0;
  return (this.dotBalls / this.ballsFaced) * 100;
});

battingStatsSchema.virtual('scoringRate').get(function() {
  if (this.ballsFaced === 0) return 0;
  return (this.runs / this.ballsFaced) * 100;
});

battingStatsSchema.virtual('runsPerOver').get(function() {
  if (this.ballsFaced === 0) return 0;
  return (this.runs / this.ballsFaced) * 6;
});

// Methods
battingStatsSchema.methods.updateStats = function() {
  // Calculate strike rate
  this.strikeRate = this.ballsFaced > 0 ? (this.runs / this.ballsFaced) * 100 : 0;
  
  // Calculate average (only if dismissed)
  this.average = !this.isNotOut && this.runs > 0 ? this.runs : 0;
  
  // Calculate control percentage
  const totalShots = this.dotBalls + this.scoringShots + this.falseShots;
  this.controlPercentage = totalShots > 0 ? 
    ((this.scoringShots + this.dotBalls) / totalShots) * 100 : 0;
  
  // Check for milestones
  this.milestones = [];
  if (this.runs >= 50) this.milestones.push('half_century');
  if (this.runs >= 100) this.milestones.push('century');
  if (this.runs >= 200) this.milestones.push('double_century');
  if (this.runs >= 300) this.milestones.push('triple_century');
  
  return this;
};

battingStatsSchema.methods.addBall = function(runs, isBoundary, isDotBall) {
  this.runs += runs;
  this.ballsFaced += 1;
  
  if (isBoundary) {
    if (runs === 4) this.fours += 1;
    if (runs === 6) this.sixes += 1;
  }
  
  if (isDotBall) {
    this.dotBalls += 1;
  } else {
    this.scoringShots += 1;
  }
  
  this.updateStats();
  return this.save();
};

// Pre-save middleware
battingStatsSchema.pre('save', function(next) {
  this.updateStats();
  next();
});

const BattingStats = mongoose.model('BattingStats', battingStatsSchema);

module.exports = BattingStats;