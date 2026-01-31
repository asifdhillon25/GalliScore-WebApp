const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  
  shortName: {
    type: String,
    required: [true, 'Short name is required'],
    uppercase: true,
    trim: true,
    maxlength: [10, 'Short name cannot exceed 10 characters']
  },
  
  // Team Details
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  logo: {
    type: String,
    default: null
  },
  
  jerseyColor: {
    primary: {
      type: String,
      default: '#000000'
    },
    secondary: {
      type: String,
      default: '#FFFFFF'
    }
  },
  
  // Team Type
  type: {
    type: String,
    enum: ['club', 'school', 'college', 'corporate', 'national', 'regional', 'local'],
    default: 'local'
  },
  
  // Location
  city: {
    type: String,
    trim: true
  },
  
  country: {
    type: String,
    trim: true,
    default: 'Pakistan'
  },
  
  homeGround: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  
  // Players
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    jerseyNumber: Number,
    role: {
      type: String,
      enum: ['captain', 'vice-captain', 'player', 'wicket-keeper'],
      default: 'player'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Management
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  viceCaptain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  coach: {
    name: String,
    contact: String
  },
  
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Team Stats
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    matchesDrawn: { type: Number, default: 0 },
    matchesTied: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    totalRunsScored: { type: Number, default: 0 },
    totalWicketsTaken: { type: Number, default: 0 }
  },
  
  // Achievements
  achievements: [{
    title: String,
    description: String,
    year: Number,
    tournament: String
  }],
  
  // Social Media
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    website: String
  },
  
  // Contact Information
  contact: {
    email: String,
    phone: String,
    address: String
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  foundedYear: {
    type: Number
  },
  
  // Ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
teamSchema.index({ name: 1 });
teamSchema.index({ shortName: 1 });
teamSchema.index({ type: 1 });
teamSchema.index({ city: 1, country: 1 });
teamSchema.index({ 'players.player': 1 });
teamSchema.index({ isActive: 1 });

// Virtuals
teamSchema.virtual('activePlayers').get(function() {
  return this.players.filter(player => player.isActive);
});

teamSchema.virtual('playerCount').get(function() {
  return this.players.length;
});

// Methods
teamSchema.methods.addPlayer = function(playerId, jerseyNumber, role = 'player') {
  this.players.push({
    player: playerId,
    jerseyNumber,
    role,
    joinedDate: Date.now(),
    isActive: true
  });
  return this.save();
};

teamSchema.methods.removePlayer = function(playerId) {
  this.players = this.players.filter(p => p.player.toString() !== playerId.toString());
  return this.save();
};

teamSchema.methods.updatePlayerRole = function(playerId, role) {
  const player = this.players.find(p => p.player.toString() === playerId.toString());
  if (player) {
    player.role = role;
  }
  return this.save();
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;