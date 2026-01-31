const mongoose = require('mongoose');

const inningSchema = new mongoose.Schema({
  // Inning Identification
  inningNumber: {
    type: Number,
    required: [true, 'Inning number is required'],
    min: [1, 'Inning number must be at least 1'],
    max: [4, 'Inning number cannot exceed 4']
  },
  
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  
  // Teams
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Batting team is required']
  },
  
  bowlingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Bowling team is required']
  },
  
  // Playing XI
  playingXI: {
    batting: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      battingPosition: Number,
      isCaptain: Boolean,
      isWicketKeeper: Boolean,
      role: String
    }],
    
    bowling: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      isCaptain: Boolean,
      bowlingOrder: Number
    }]
  },
  
  // Inning Details
  target: {
    type: Number,
    default: null
  },
  
  oversLimit: {
    type: Number,
    required: [true, 'Overs limit is required']
  },
  
  wicketsLimit: {
    type: Number,
    default: 10
  },
  
  // Inning Status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'declared', 'forfeited', 'abandoned'],
    default: 'not_started'
  },
  
  result: {
    type: String,
    enum: ['won', 'lost', 'drawn', 'tied', null],
    default: null
  },
  
  // Score Details
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
  
  // Extras Breakdown
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Current Batting Pair
  currentBatsmen: {
    striker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    nonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  
  // Current Bowler
  currentBowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Fall of Wickets
  fallOfWickets: [{
    wicketNumber: Number,
    runs: Number,
    partnership: Number,
    overs: Number,
    balls: Number,
    batsman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    dismissal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dismissal'
    },
    timestamp: Date
  }],
  
  // Partnerships
  partnerships: [{
    batsman1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    batsman2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: Number,
    balls: Number,
    startedAt: Date,
    endedAt: Date
  }],
  
  // Powerplays
  powerplays: [{
    type: {
      type: String,
      enum: ['mandatory', 'bowling', 'batting']
    },
    fromOver: Number,
    toOver: Number,
    runs: Number,
    wickets: Number
  }],
  
  // Over History
  oversHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Over'
  }],
  
  // Time Tracking
  startTime: {
    type: Date,
    default: null
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  duration: {
    type: Number, // in minutes
    default: 0
  },
  
  // Additional Info
  declaration: {
    declared: Boolean,
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    declaredAt: Date,
    reason: String
  },
  
  followOn: {
    enforced: Boolean,
    enforcedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  
  // Weather & Interruptions
  interruptions: [{
    reason: String,
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  
  // Scorer Information
  scoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Scorer is required']
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
inningSchema.index({ matchId: 1, inningNumber: 1 });
inningSchema.index({ battingTeam: 1 });
inningSchema.index({ bowlingTeam: 1 });
inningSchema.index({ status: 1 });

// Virtuals
inningSchema.virtual('runRate').get(function() {
  const totalBalls = (this.overs * 6) + this.balls;
  if (totalBalls === 0) return 0;
  return (this.runs / totalBalls) * 6;
});

inningSchema.virtual('requiredRunRate').get(function() {
  if (!this.target || this.status !== 'in_progress') return null;
  
  const remainingRuns = this.target - this.runs;
  const remainingBalls = (this.oversLimit * 6) - ((this.overs * 6) + this.balls);
  
  if (remainingBalls <= 0) return Infinity;
  return (remainingRuns / remainingBalls) * 6;
});

inningSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed' || 
         this.status === 'declared' || 
         this.status === 'forfeited' || 
         this.status === 'abandoned';
});

inningSchema.virtual('isInProgress').get(function() {
  return this.status === 'in_progress';
});

inningSchema.virtual('ballsRemaining').get(function() {
  const totalBalls = this.oversLimit * 6;
  const ballsBowled = (this.overs * 6) + this.balls;
  return Math.max(0, totalBalls - ballsBowled);
});

// Methods
inningSchema.methods.startInning = function() {
  if (this.status !== 'not_started') {
    throw new Error('Inning can only be started from not_started status');
  }
  
  this.status = 'in_progress';
  this.startTime = new Date();
  return this.save();
};

inningSchema.methods.endInning = function(result = 'completed') {
  this.status = result;
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  return this.save();
};

inningSchema.methods.addOver = function(overId) {
  this.oversHistory.push(overId);
  return this.save();
};

inningSchema.methods.updateScore = function(runs, wickets, extras = {}) {
  this.runs += runs;
  this.wickets += wickets;
  
  // Update extras
  if (extras.wides) this.extras.wides += extras.wides;
  if (extras.noBalls) this.extras.noBalls += extras.noBalls;
  if (extras.byes) this.extras.byes += extras.byes;
  if (extras.legByes) this.extras.legByes += extras.legByes;
  if (extras.penalty) this.extras.penalty += extras.penalty;
  
  this.extras.total = this.extras.wides + this.extras.noBalls + 
                      this.extras.byes + this.extras.legByes + 
                      this.extras.penalty;
  
  return this.save();
};

inningSchema.methods.updateBalls = function() {
  this.balls += 1;
  if (this.balls >= 6) {
    this.overs += 1;
    this.balls = 0;
  }
  return this.save();
};

const Inning = mongoose.model('Inning', inningSchema);

module.exports = Inning;