const User = require('./User.model');
const Player = require('./Player.model');
const Team = require('./Team.model');
const Match = require('./Match.model');
const Inning = require('./Inning.model');
const Over = require('./Over.model');
const BattingStats = require('./BattingStats.model');
const BowlingStats = require('./BowlingStats.model');
const Tournament = require('./Tournament.model');
const Venue = require('./Venue.model');

// Import schemas
const DismissalSchema = require('../schemas/Dismissal.schema');
const BallSchema = require('../schemas/Ball.schema');
const ExtrasSchema = require('../schemas/Extras.schema');

// Create models for embedded schemas if needed
const Dismissal = require('../schemas/Dismissal.schema');
const Ball = require('../schemas/Ball.schema');
const Extras = require('../schemas/Extras.schema');

module.exports = {
  User,
  Player,
  Team,
  Match,
  Inning,
  Over,
  BattingStats,
  BowlingStats,
  Tournament,
  Venue,
  Dismissal,
  Ball,
  Extras,
  
  // Schemas for embedding
  DismissalSchema,
  BallSchema,
  ExtrasSchema
};