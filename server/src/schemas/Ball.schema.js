const mongoose = require('mongoose');

const ballSchema = new mongoose.Schema({
  // Ball Identification
  ballNumber: {
    type: Number,
    required: [true, 'Ball number is required'],
    min: [1, 'Ball number must be at least 1'],
    max: [6, 'Ball number cannot exceed 6']
  },
  
  overNumber: {
    type: Number,
    required: [true, 'Over number is required'],
    min: [1, 'Over number must be at least 1']
  },
  
  // Scoring Details
  runs: {
    type: Number,
    required: [true, 'Runs are required'],
    min: [0, 'Runs cannot be negative'],
    default: 0
  },
  
  isBoundary: {
    type: Boolean,
    default: false
  },
  
  boundaryType: {
    type: String,
    enum: ['4', '6', null],
    default: null
  },
  
  // Delivery Type
  deliveryType: {
    type: String,
    enum: ['normal', 'wide', 'no_ball', 'bye', 'leg_bye', 'dead_ball'],
    default: 'normal'
  },
  
  // Dismissal Details
  isWicket: {
    type: Boolean,
    default: false
  },
  
  dismissal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dismissal'
  },
  
  // Players Involved
  batsman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Batsman is required']
  },
  
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Bowler is required']
  },
  
  nonStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Non-striker is required']
  },
  
  // Fielding details for wickets
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Extras Breakdown
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 }
  },
  
  // Ball Description
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Time tracking
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Additional Info
  isReview: {
    type: Boolean,
    default: false
  },
  
  reviewResult: {
    type: String,
    enum: ['upheld', 'overturned', 'umpires_call', null],
    default: null
  }
}, {
  _id: false,
  timestamps: false
});

module.exports = ballSchema;