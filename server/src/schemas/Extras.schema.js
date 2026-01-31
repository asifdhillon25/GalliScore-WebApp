const mongoose = require('mongoose');

const extrasSchema = new mongoose.Schema({
  // Extra Types
  wides: {
    type: Number,
    default: 0,
    min: [0, 'Wides cannot be negative']
  },
  
  noBalls: {
    type: Number,
    default: 0,
    min: [0, 'No balls cannot be negative']
  },
  
  byes: {
    type: Number,
    default: 0,
    min: [0, 'Byes cannot be negative']
  },
  
  legByes: {
    type: Number,
    default: 0,
    min: [0, 'Leg byes cannot be negative']
  },
  
  penalty: {
    type: Number,
    default: 0,
    min: [0, 'Penalty cannot be negative']
  },
  
  // Total (calculated)
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative']
  }
}, {
  _id: false,
  timestamps: false
});

// Calculate total before save
extrasSchema.pre('save', function(next) {
  this.total = this.wides + this.noBalls + this.byes + this.legByes + this.penalty;
  next();
});

module.exports = extrasSchema;