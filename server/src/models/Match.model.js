const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Match Information
  title: {
    type: String,
    required: [true, 'Match title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Format & Type
  format: {
    type: String,
    required: [true, 'Match format is required'],
    enum: ['t20', 'odi', 'test', 't10', 'the_hundred', 'custom'],
    default: 'custom'
  },
  
  matchType: {
    type: String,
    enum: ['friendly', 'league', 'knockout', 'final', 'exhibition', null],
    default: null
  },
  
  // Teams
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team 1 is required']
  },
  
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team 2 is required']
  },
  
  // Match Officials
  umpires: [{
    name: String,
    role: {
      type: String,
      enum: ['field', 'tv', 'reserve', 'match_referee']
    }
  }],
  
  scorers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'backup']
    }
  }],
  
  // Match Details
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  
  date: {
    type: Date,
    required: [true, 'Match date is required']
  },
  
  startTime: {
    type: Date
  },
  
  endTime: {
    type: Date
  },
  
  // Toss & Decision
  toss: {
    wonBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    decision: {
      type: String,
      enum: ['bat', 'bowl', null],
      default: null
    },
    electedTo: {
      type: String,
      enum: ['bat', 'field', null],
      default: null
    }
  },
  
  // Match Rules
  rules: {
    oversPerInning: {
      type: Number,
      default: 20 // T20 default
    },
    
    maxOversPerBowler: {
      type: Number,
      default: 4 // T20 default
    },
    
    powerplayOvers: {
      mandatory: { type: Number, default: 6 },
      batting: { type: Number, default: 0 },
      bowling: { type: Number, default: 0 }
    },
    
    superOver: {
      type: Boolean,
      default: false
    },
    
    drsAvailable: {
      type: Boolean,
      default: false
    },
    
    followOn: {
      runsRequired: { type: Number, default: 200 }
    },
    
    newBall: {
      afterOvers: { type: Number, default: 80 } // Test matches
    }
  },
  
  // Match Status
  status: {
    type: String,
    enum: [
      'scheduled', 
      'toss', 
      'inning_1', 
      'inning_2', 
      'inning_3', 
      'inning_4',
      'super_over',
      'completed',
      'abandoned',
      'cancelled',
      'live'
    ],
    default: 'scheduled'
  },
  
  result: {
    type: String,
    enum: [
      'team1_win', 
      'team2_win', 
      'draw', 
      'tie', 
      'no_result',
      'abandoned',
      null
    ],
    default: null
  },
  
  resultDescription: {
    type: String,
    maxlength: [200, 'Result description cannot exceed 200 characters']
  },
  
  // Innings
  innings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inning'
  }],
  
  // Tournament Information
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  
  round: {
    type: String,
    trim: true
  },
  
  group: {
    type: String,
    trim: true
  },
  
  // Points & Rankings
  points: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  
  // Awards
  awards: {
    manOfTheMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    bestBatsman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    bestBowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  
  // Weather & Conditions
  weather: {
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'overcast', 'clear', null],
      default: null
    },
    temperature: Number,
    humidity: Number,
    pitchCondition: {
      type: String,
      enum: ['green', 'dry', 'dusty', 'damp', 'flat', null],
      default: null
    }
  },
  
  // Match Statistics
  statistics: {
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalFours: { type: Number, default: 0 },
    totalSixes: { type: Number, default: 0 },
    totalExtras: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    bestBowling: {
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 }
    }
  },
  
  // Broadcast Information
  broadcast: {
    channel: String,
    streamingUrl: String
  },
  
  // Match Fees & Payments
  matchFees: {
    umpireFee: Number,
    scorerFee: Number,
    groundFee: Number
  },
  
  // Privacy & Sharing
  isPublic: {
    type: Boolean,
    default: true
  },
  
  shareCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
matchSchema.index({ team1: 1, team2: 1 });
matchSchema.index({ date: -1 });
matchSchema.index({ status: 1 });
matchSchema.index({ format: 1 });
matchSchema.index({ tournament: 1 });
matchSchema.index({ createdBy: 1 });
matchSchema.index({ isPublic: 1 });
matchSchema.index({ shareCode: 1 }, { unique: true, sparse: true });

// Virtuals
matchSchema.virtual('winningTeam').get(function() {
  if (this.result === 'team1_win') return this.team1;
  if (this.result === 'team2_win') return this.team2;
  return null;
});

matchSchema.virtual('losingTeam').get(function() {
  if (this.result === 'team1_win') return this.team2;
  if (this.result === 'team2_win') return this.team1;
  return null;
});

matchSchema.virtual('isLive').get(function() {
  return this.status === 'live' || 
         this.status === 'inning_1' || 
         this.status === 'inning_2' ||
         this.status === 'inning_3' ||
         this.status === 'inning_4' ||
         this.status === 'super_over';
});

matchSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

matchSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / (1000 * 60 * 60)); // hours
});

// Methods
matchSchema.methods.startMatch = function() {
  this.status = 'toss';
  this.startTime = new Date();
  return this.save();
};

matchSchema.methods.recordToss = function(teamId, decision) {
  this.toss.wonBy = teamId;
  this.toss.decision = decision;
  this.toss.electedTo = decision === 'bat' ? 'bat' : 'field';
  this.status = 'inning_1';
  return this.save();
};

matchSchema.methods.endMatch = function(result, description = '') {
  this.status = 'completed';
  this.result = result;
  this.resultDescription = description;
  this.endTime = new Date();
  return this.save();
};

matchSchema.methods.addInning = function(inningId) {
  this.innings.push(inningId);
  return this.save();
};

matchSchema.methods.generateShareCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.shareCode = code;
  return this.save();
};

// Pre-save middleware to set format-specific rules
matchSchema.pre('save', function(next) {
  // Set default rules based on format
  if (this.format === 't20') {
    this.rules.oversPerInning = 20;
    this.rules.maxOversPerBowler = 4;
    this.rules.powerplayOvers = { mandatory: 6, batting: 0, bowling: 0 };
  } else if (this.format === 'odi') {
    this.rules.oversPerInning = 50;
    this.rules.maxOversPerBowler = 10;
    this.rules.powerplayOvers = { mandatory: 10, batting: 5, bowling: 5 };
  } else if (this.format === 'test') {
    this.rules.oversPerInning = Infinity; // No over limit
    this.rules.maxOversPerBowler = Infinity;
    this.rules.powerplayOvers = { mandatory: 0, batting: 0, bowling: 0 };
    this.rules.followOn.runsRequired = 200;
  } else if (this.format === 't10') {
    this.rules.oversPerInning = 10;
    this.rules.maxOversPerBowler = 2;
    this.rules.powerplayOvers = { mandatory: 3, batting: 0, bowling: 0 };
  }
  
  next();
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;