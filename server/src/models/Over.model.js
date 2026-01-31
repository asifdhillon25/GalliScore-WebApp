const mongoose = require('mongoose');
const ballSchema = require('../schemas/Ball.schema');

const overSchema = new mongoose.Schema({
  // Over Identification
  overNumber: {
    type: Number,
    required: [true, 'Over number is required'],
    min: [1, 'Over number must be at least 1']
  },
  
  inningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inning',
    required: [true, 'Inning ID is required']
  },
  
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  
  // Bowler Information
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Bowler is required']
  },
  
  // Balls in this over
  balls: [ballSchema],
  
  // Over Summary
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
  
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  isMaiden: {
    type: Boolean,
    default: false
  },
  
  // Powerplay Information
  powerplay: {
    type: String,
    enum: [1, 2, 3, null], // Powerplay 1, 2, 3 or null
    default: null
  },
  
  // Over Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'interrupted'],
    default: 'in_progress'
  },
  
  // Timestamps
  startTime: {
    type: Date,
    default: Date.now
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
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
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
overSchema.index({ matchId: 1, inningId: 1, overNumber: 1 });
overSchema.index({ bowler: 1 });
overSchema.index({ status: 1 });

// Virtuals
overSchema.virtual('ballCount').get(function() {
  return this.balls.length;
});

overSchema.virtual('legalBalls').get(function() {
  return this.balls.filter(ball => 
    ball.deliveryType === 'normal' || 
    ball.deliveryType === 'bye' || 
    ball.deliveryType === 'leg_bye'
  ).length;
});

// Methods
overSchema.methods.addBall = function(ballData) {
  this.balls.push(ballData);
  this.updateOverStats();
  return this.save();
};

overSchema.methods.updateOverStats = function() {
  // Calculate runs, wickets, extras
  this.runs = this.balls.reduce((total, ball) => {
    let ballRuns = ball.runs;
    
    // Add extras
    if (ball.extras) {
      ballRuns += (ball.extras.wides || 0);
      ballRuns += (ball.extras.noBalls || 0);
      ballRuns += (ball.extras.byes || 0);
      ballRuns += (ball.extras.legByes || 0);
      ballRuns += (ball.extras.penalty || 0);
    }
    
    return total + ballRuns;
  }, 0);
  
  this.wickets = this.balls.filter(ball => ball.isWicket).length;
  
  // Calculate extras breakdown
  this.extras = {
    wides: this.balls.reduce((total, ball) => total + (ball.extras?.wides || 0), 0),
    noBalls: this.balls.reduce((total, ball) => total + (ball.extras?.noBalls || 0), 0),
    byes: this.balls.reduce((total, ball) => total + (ball.extras?.byes || 0), 0),
    legByes: this.balls.reduce((total, ball) => total + (ball.extras?.legByes || 0), 0),
    penalty: this.balls.reduce((total, ball) => total + (ball.extras?.penalty || 0), 0),
    total: this.balls.reduce((total, ball) => {
      const ballExtras = ball.extras || {};
      return total + 
        (ballExtras.wides || 0) + 
        (ballExtras.noBalls || 0) + 
        (ballExtras.byes || 0) + 
        (ballExtras.legByes || 0) + 
        (ballExtras.penalty || 0);
    }, 0)
  };
  
  // Check if maiden over (no runs conceded by bowler)
  const runsFromBowler = this.balls.reduce((total, ball) => {
    if (ball.deliveryType === 'wide' || ball.deliveryType === 'no_ball') {
      return total; // Wides and no-balls don't count against bowler for maiden
    }
    return total + (ball.runs || 0);
  }, 0);
  
  this.isMaiden = runsFromBowler === 0 && this.legalBalls >= 6;
  
  // Mark as completed if 6 legal balls
  if (this.legalBalls >= 6 && this.status === 'in_progress') {
    this.status = 'completed';
    this.endTime = new Date();
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
  }
};

overSchema.pre('save', function(next) {
  this.updateOverStats();
  next();
});

const Over = mongoose.model('Over', overSchema);

module.exports = Over;