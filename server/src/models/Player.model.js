const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // Display Name (for scoreboard)
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  
  // Player Identification
  jerseyNumber: {
    type: Number,
    min: [1, 'Jersey number must be at least 1'],
    max: [999, 'Jersey number cannot exceed 999']
  },
  
  // Player Details
  dateOfBirth: {
    type: Date
  },
  
  battingStyle: {
    type: String,
    enum: ['right-hand', 'left-hand', null],
    default: null
  },
  
  bowlingStyle: {
    type: String,
    enum: ['right-arm fast', 'right-arm medium', 'right-arm spin', 
           'left-arm fast', 'left-arm medium', 'left-arm spin',
           null],
    default: null
  },
  
  primaryRole: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper', null],
    default: null
  },
  
  // Physical Attributes
  height: {
    type: Number, // in cm
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm']
  },
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  
  phoneNumber: {
    type: String,
    trim: true
  },
  
  // Social Media
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String
  },
  
  // Player Image
  profileImage: {
    type: String,
    default: null
  },
  
  // Teams
  currentTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  
  // Career Stats (cached for performance)
  careerStats: {
    batting: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      ballsFaced: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      centuries: { type: Number, default: 0 },
      halfCenturies: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      notOuts: { type: Number, default: 0 }
    },
    
    bowling: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      bestBowling: {
        wickets: { type: Number, default: 0 },
        runs: { type: Number, default: 0 }
      },
      fiveWickets: { type: Number, default: 0 }
    },
    
    fielding: {
      catches: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
      runOuts: { type: Number, default: 0 }
    }
  },
  
  // Awards & Achievements
  awards: [{
    title: String,
    description: String,
    year: Number,
    tournament: String
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  retiredDate: {
    type: Date,
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
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
playerSchema.index({ displayName: 1 });
playerSchema.index({ 'careerStats.batting.runs': -1 });
playerSchema.index({ 'careerStats.bowling.wickets': -1 });
playerSchema.index({ isActive: 1 });
playerSchema.index({ currentTeams: 1 });

// Virtuals
playerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

playerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Methods
playerSchema.methods.updateCareerStats = async function() {
  // This method would aggregate stats from matches
  // For now, it's a placeholder
  return this;
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;