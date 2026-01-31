const mongoose = require('mongoose');

// Player Schema
const PlayerSchema = mongoose.Schema({
    pName: {
        type: String,
        required: [true, "Please enter player name"]
    },
    pTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
  
});

// Match Record Schema
const BattingRecordSchema = mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    totalRuns: { type: Number, default: 0 },    // Total runs scored by the batter
    ballsFaced: { type: Number, default: 0 },   // Number of balls faced
    fours: { type: Number, default: 0 },        // Number of fours hit
    sixes: { type: Number, default: 0 },        // Number of sixes hit
    strikeRate: { type: Number, default: 0 },   // Strike rate calculated as (totalRuns / ballsFaced) * 100
    // Add other batting specific metrics if needed
  });

  const BowlingRecordSchema = mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    oversBowled: { type: Number, default: 0 }, // Total overs bowled
    ballsBowled: { type: Number, default: 0 }, // Total balls bowled
    runsConceded: { type: Number, default: 0 }, // Runs conceded by the bowler
    wicketsTaken: { type: Number, default: 0 }, // Wickets taken by the bowler
    maidens: { type: Number, default: 0 },      // Maidens (overs bowled without conceding any runs)
    extras: { type: Number, default: 0 },       // Extras (wides, no-balls)
    economyRate: { type: Number, default: 0 },  // Economy rate calculated as runsConceded / oversBowled
    AllOverDetails:{type: mongoose.Schema.Types.ObjectId, ref: 'AllOverDetails'}
  });
  

// Over Detail Schema
const AllOverDetailsSchema = mongoose.Schema({
    noOfOvers: { type: Number },
    eachOverDetail: [{ type: mongoose.Schema.Types.ObjectId, ref: "OneOver" }] // Consistent naming
});

// One Over Schema
const OneOverSchema = mongoose.Schema({
    BallDetail: [{ type: String }] // Consistent naming
});

// Single Ball Schema


// Team Schema
const TeamSchema = mongoose.Schema({
    tName: {
        type: String,
        required: [true, "Please enter team name"]
    },
    tPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }]
});


const MatchSchema = mongoose.Schema({
    Userid:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mTeam1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    mTeam2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    team1Score: { type: Number },
    team2Score: { type: Number },
    NoOfOvers:{ type: Number },
    NoOfWickets:{ type: Number },
    WinDecision:{ type: String },
    Toss:{type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
    BattingRecords: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'BattingRecord' 
    }],
    BowlingRecords: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'BowlingRecord' 
      }],
    FirstScoreBoard:{type:mongoose.Schema.Types.ObjectId, ref: 'ScoreBoard' },
    SecondScoreBoard:{type:mongoose.Schema.Types.ObjectId, ref: 'ScoreBoard' },
    result: { type: String }
  });
  

  const ScoreBoardSchema = mongoose.Schema({
    TeamBat:{ type: String },
    TeamBowl:{ type: String },
    Striker:{ type: String },
    nonStriker:{ type: String },
    Bowler:{ type: String },
    TeamRuns: { type: Number, default: 0 },
    StrikerRuns: { type: Number, default: 0 },
    StrikerBalls: { type: Number, default: 0 },
    nonStrikerRuns: { type: Number, default: 0 },
    nonStrikerBalls: { type: Number, default: 0 },
    TotalWickets:{type: Number, default: 0 },
    BowlerWickets:{type: Number, default: 0 },
    CurrentOver:{type: Number, default: 0 },
    CurrentBall:{type: Number, default: 0 },
    OverBalls:[{ type: String}],
    BowlerOverNo:{type: Number, default: 0 },
    BowlerRun:{type: Number, default: 0},
    Extras:{type: Number, default: 0},
    
});

// Create and export models

const Player = mongoose.model('Player', PlayerSchema);
const BattingRecord = mongoose.model('BattingRecord', BattingRecordSchema);
const AllOverDetails = mongoose.model('AllOverDetails', AllOverDetailsSchema); // Added model
const OneOver = mongoose.model('OneOver', OneOverSchema); // Added model

const Team = mongoose.model('Team', TeamSchema);
const Match = mongoose.model('Match', MatchSchema);
const ScoreBoard = mongoose.model('ScoreBoard', ScoreBoardSchema);
const BowlingRecord = mongoose.model('BowlingRecord', BowlingRecordSchema);

module.exports = { Player, AllOverDetails, OneOver, Team, Match,ScoreBoard,BattingRecord,BowlingRecord};
