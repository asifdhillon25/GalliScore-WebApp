const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  
  shortName: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Short name cannot exceed 10 characters']
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  logo: {
    type: String,
    default: null
  },
  
  // Tournament Details
  type: {
    type: String,
    required: [true, 'Tournament type is required'],
    enum: ['league', 'knockout', 'group_knockout', 'round_robin', 'multi_stage']
  },
  
  format: {
    type: String,
    required: [true, 'Tournament format is required'],
    enum: ['t20', 'odi', 'test', 'mixed']
  },
  
  season: {
    type: String,
    required: [true, 'Season is required'],
    match: [/^\d{4}-\d{4}$/, 'Season must be in format YYYY-YYYY']
  },
  
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  registrationDeadline: {
    type: Date
  },
  
  // Teams
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    group: String,
    seeding: Number,
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'withdrawn', 'disqualified'],
      default: 'registered'
    }
  }],
  
  // Groups
  groups: [{
    name: {
      type: String,
      required: [true, 'Group name is required']
    },
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }]
  }],
  
  // Structure
  structure: {
    totalTeams: Number,
    totalMatches: Number,
    groupMatches: Number,
    knockoutMatches: Number,
    superOver: Boolean,
    reserveDays: Number
  },
  
  // Rules
  rules: {
    pointsSystem: {
      win: { type: Number, default: 2 },
      tie: { type: Number, default: 1 },
      noResult: { type: Number, default: 1 },
      loss: { type: Number, default: 0 }
    },
    
    netRunRate: {
      type: Boolean,
      default: true
    },
    
    qualification: {
      fromGroup: Number,
      bestThirdPlace: Boolean
    },
    
    playerRestrictions: {
      overseas: Number,
      under19: Number,
      professional: Number
    }
  },
  
  // Schedule
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  
  // Venues
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  
  // Officials
  officials: {
    tournamentDirector: String,
    matchReferees: [String],
    umpires: [String],
    scorers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Prizes
  prizes: {
    winner: {
      amount: Number,
      trophy: String
    },
    
    runnerUp: {
      amount: Number,
      trophy: String
    },
    
    manOfTheSeries: {
      amount: Number,
      trophy: String
    },
    
    individualAwards: [{
      title: String,
      criteria: String,
      prize: String
    }]
  },
  
  // Sponsors
  sponsors: [{
    name: String,
    type: {
      type: String,
      enum: ['title', 'associate', 'partner']
    },
    logo: String,
    website: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'upcoming'
  },
  
  // Standings
  standings: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    
    matches: {
      played: { type: Number, default: 0 },
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      tied: { type: Number, default: 0 },
      noResult: { type: Number, default: 0 }
    },
    
    points: {
      type: Number,
      default: 0
    },
    
    netRunRate: {
      type: Number,
      default: 0
    },
    
    runs: {
      for: { type: Number, default: 0 },
      against: { type: Number, default: 0 }
    },
    
    wickets: {
      for: { type: Number, default: 0 },
      against: { type: Number, default: 0 }
    },
    
    overs: {
      for: { type: Number, default: 0 },
      against: { type: Number, default: 0 }
    }
  }],
  
  // Winners
  winners: {
    champion: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      year: Number
    },
    
    runnerUp: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      year: Number
    },
    
    thirdPlace: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      year: Number
    }
  },
  
  // Statistics
  statistics: {
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalFours: { type: Number, default: 0 },
    totalSixes: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    bestBowling: {
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 }
    },
    mostRuns: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      runs: { type: Number, default: 0 }
    },
    mostWickets: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      wickets: { type: Number, default: 0 }
    }
  },
  
  // Media & Coverage
  media: {
    broadcaster: String,
    streamingUrl: String,
    hashtag: String
  },
  
  // Registration
  registration: {
    open: { type: Boolean, default: false },
    fee: Number,
    maxTeams: Number,
    minTeams: Number
  },
  
  // Privacy
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Organization
  organizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  
  organizers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  
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
tournamentSchema.index({ name: 1 });
tournamentSchema.index({ season: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ organizedBy: 1 });
tournamentSchema.index({ visibility: 1 });

// Virtuals
tournamentSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
});

tournamentSchema.virtual('isRegistrationOpen').get(function() {
  if (!this.registration.open) return false;
  if (!this.registrationDeadline) return true;
  return new Date() <= this.registrationDeadline;
});

tournamentSchema.virtual('teamsCount').get(function() {
  return this.teams.length;
});

tournamentSchema.virtual('matchesCount').get(function() {
  return this.structure?.totalMatches || 0;
});

// Methods
tournamentSchema.methods.addTeam = function(teamId, group = null, seeding = null) {
  this.teams.push({
    team: teamId,
    group,
    seeding,
    status: 'registered'
  });
  
  if (group) {
    const groupObj = this.groups.find(g => g.name === group);
    if (groupObj) {
      groupObj.teams.push(teamId);
    } else {
      this.groups.push({
        name: group,
        teams: [teamId]
      });
    }
  }
  
  return this.save();
};

tournamentSchema.methods.removeTeam = function(teamId) {
  this.teams = this.teams.filter(t => t.team.toString() !== teamId.toString());
  
  // Remove from groups
  this.groups.forEach(group => {
    group.teams = group.teams.filter(t => t.toString() !== teamId.toString());
  });
  
  // Remove empty groups
  this.groups = this.groups.filter(group => group.teams.length > 0);
  
  return this.save();
};

tournamentSchema.methods.updateStandings = async function() {
  // This would aggregate standings from matches
  // For now, it's a placeholder
  return this;
};

tournamentSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.inviteCode = code;
  return this.save();
};

// Pre-save middleware
tournamentSchema.pre('save', function(next) {
  // Auto-generate short name if not provided
  if (!this.shortName) {
    this.shortName = this.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 10);
  }
  
  next();
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;