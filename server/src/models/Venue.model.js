const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Venue name cannot exceed 100 characters']
  },
  
  shortName: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Short name cannot exceed 10 characters']
  },
  
  // Location
  address: {
    street: String,
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: String,
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Pakistan'
    },
    postalCode: String
  },
  
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  
  // Venue Details
  type: {
    type: String,
    enum: ['stadium', 'ground', 'academy', 'school', 'college', 'club'],
    default: 'ground'
  },
  
  capacity: {
    type: Number,
    min: [0, 'Capacity cannot be negative']
  },
  
  // Pitch Information
  pitches: {
    total: {
      type: Number,
      default: 1,
      min: [1, 'Total pitches must be at least 1']
    },
    
    surface: {
      type: String,
      enum: ['grass', 'concrete', 'matting', 'astro_turf', 'hybrid', null],
      default: null
    },
    
    condition: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'under_repair', null],
      default: null
    },
    
    dimensions: {
      length: Number, // in meters
      width: Number   // in meters
    }
  },
  
  // Facilities
  facilities: {
    floodlights: Boolean,
    sightscreens: Boolean,
    scoreboard: {
      type: String,
      enum: ['electronic', 'manual', 'none'],
      default: 'manual'
    },
    
    pavilion: Boolean,
    dressingRooms: Boolean,
    practiceNets: Boolean,
    parking: Boolean,
    foodStalls: Boolean,
    washrooms: Boolean
  },
  
  // Ground Dimensions
  boundaries: {
    squareLeg: {
      type: Number,
      min: [0, 'Boundary distance cannot be negative']
    },
    fineLeg: {
      type: Number,
      min: [0, 'Boundary distance cannot be negative']
    },
    midWicket: {
      type: Number,
      min: [0, 'Boundary distance cannot be negative']
    },
    covers: {
      type: Number,
      min: [0, 'Boundary distance cannot be negative']
    },
    straight: {
      type: Number,
      min: [0, 'Boundary distance cannot be negative']
    }
  },
  
  // Contact Information
  contact: {
    phone: String,
    email: String,
    website: String,
    manager: String
  },
  
  // Booking Information
  booking: {
    available: {
      type: Boolean,
      default: false
    },
    
    rate: {
      hourly: Number,
      daily: Number,
      weekly: Number
    },
    
    contactPerson: String,
    bookingPhone: String,
    bookingEmail: String
  },
  
  // Images
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  
  // Historical Information
  established: {
    type: Number // Year
  },
  
  firstMatch: {
    date: Date,
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }]
  },
  
  // Statistics
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 }
  },
  
  // Pitch Behavior (for analysis)
  pitchBehavior: {
    pace: {
      type: Number,
      min: [1, 'Pace rating must be between 1 and 10'],
      max: [10, 'Pace rating must be between 1 and 10']
    },
    
    bounce: {
      type: Number,
      min: [1, 'Bounce rating must be between 1 and 10'],
      max: [10, 'Bounce rating must be between 1 and 10']
    },
    
    turn: {
      type: Number,
      min: [1, 'Turn rating must be between 1 and 10'],
      max: [10, 'Turn rating must be between 1 and 10']
    },
    
    seam: {
      type: Number,
      min: [1, 'Seam rating must be between 1 and 10'],
      max: [10, 'Seam rating must be between 1 and 10']
    }
  },
  
  // Weather Patterns
  weatherPatterns: {
    rainProbability: Number, // percentage
    averageTemperature: Number, // celsius
    humidity: Number // percentage
  },
  
  // Social Media
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
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
venueSchema.index({ name: 1 });
venueSchema.index({ 'address.city': 1, 'address.country': 1 });
venueSchema.index({ type: 1 });
venueSchema.index({ isActive: 1 });
venueSchema.index({ coordinates: '2dsphere' });

// Virtuals
venueSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

venueSchema.virtual('averageBoundary').get(function() {
  const boundaries = [
    this.boundaries.squareLeg,
    this.boundaries.fineLeg,
    this.boundaries.midWicket,
    this.boundaries.covers,
    this.boundaries.straight
  ].filter(b => b > 0);
  
  if (boundaries.length === 0) return 0;
  return boundaries.reduce((sum, b) => sum + b, 0) / boundaries.length;
});

venueSchema.virtual('pitchRating').get(function() {
  const ratings = [
    this.pitchBehavior.pace,
    this.pitchBehavior.bounce,
    this.pitchBehavior.turn,
    this.pitchBehavior.seam
  ].filter(r => r > 0);
  
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
});

// Methods
venueSchema.methods.addMatch = function() {
  this.statistics.matchesPlayed += 1;
  return this.save();
};

venueSchema.methods.updateStatistics = function(runs, wickets) {
  this.statistics.totalRuns += runs;
  this.statistics.totalWickets += wickets;
  
  // Update average score
  if (this.statistics.matchesPlayed > 0) {
    this.statistics.averageScore = this.statistics.totalRuns / this.statistics.matchesPlayed;
  }
  
  return this.save();
};

venueSchema.methods.setPrimaryImage = function(imageUrl) {
  this.images.forEach(img => {
    img.isPrimary = img.url === imageUrl;
  });
  return this.save();
};

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;