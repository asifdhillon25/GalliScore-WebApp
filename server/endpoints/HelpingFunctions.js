const mongoose = require("mongoose");
const { BattingRecord, BowlingRecord, ScoreBoard, Match,Player } = require('../models/cdb.models.js'); // Adjust path as needed

// Find or Create Batting Record by Player ID
async function findOrCreateBattingRecord(playerId, matchId) {
  try {
    let battingRecord = await BattingRecord.findOne({ player: playerId, match: matchId }).exec();

    if (!battingRecord) {
      battingRecord = await BattingRecord.create({ player: playerId, match: matchId });
    }

    return battingRecord;
  } catch (error) {
    console.error('Error finding or creating batting record:', error);
    throw error; // Handle error as appropriate
  }
}

// Find or Create Bowling Record by Player ID
async function findOrCreateBowlingRecord(playerId, matchId) {
  try {
    let bowlingRecord = await BowlingRecord.findOne({ player: playerId, match: matchId }).exec();

    if (!bowlingRecord) {
      bowlingRecord = await BowlingRecord.create({ player: playerId, match: matchId });
    }

    return bowlingRecord;
  } catch (error) {
    console.error('Error finding or creating bowling record:', error);
    throw error; // Handle error as appropriate
  }
}

// Find or Create ScoreBoard by ScoreBoard ID
async function findScoreBoard(scoreBoardId) {
  try {
    const scoreBoard = await ScoreBoard.findById(scoreBoardId).exec();
    return scoreBoard;
  } catch (error) {
    console.error('Error finding scoreboard by scoreboard ID:', error);
    throw error; // Handle error as appropriate
  }
}


async function findPlayerById(playerId) {
  try {
    let PlayerEntity = await Player.findById(playerId).exec();

    if (!PlayerEntity) {
      throw new error("error finding player record");
    }

    return PlayerEntity;
  } catch (error) {
    console.error('Error finding Player record:', error);
    throw error; // Handle error as appropriate
  }
}


// Export functions
module.exports = {
  findOrCreateBattingRecord,
  findOrCreateBowlingRecord,
  findScoreBoard,
  findPlayerById
  
};
