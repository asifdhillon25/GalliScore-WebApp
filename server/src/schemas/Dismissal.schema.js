const mongoose = require('mongoose');

const dismissalSchema = new mongoose.Schema({
  // Dismissal Type
  type: {
    type: String,
    required: [true, 'Dismissal type is required'],
    enum: [
      'bowled',
      'caught',
      'lbw',
      'run_out',
      'stumped',
      'hit_wicket',
      'hit_twice',
      'obstructing_field',
      'timed_out',
      'handled_ball',
      'retired',
      'absent'
    ]
  },
  
  // Dismissal Details
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Players Involved
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Run Out Details
  runOutDetails: {
    isDirectHit: Boolean,
    end: {
      type: String,
      enum: ['bowlers', 'strikers']
    }
  },
  
  // LBW Details
  lbwDetails: {
    pitching: {
      type: String,
      enum: ['leg_stump', 'middle_stump', 'off_stump', 'outside_leg', 'outside_off']
    },
    impact: {
      type: String,
      enum: ['umpires_call', 'hitting', 'missing']
    },
    wicketsHitting: {
      type: String,
      enum: ['umpires_call', 'hitting', 'missing']
    }
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true,
  timestamps: false
});

module.exports = dismissalSchema;