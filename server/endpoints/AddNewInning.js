const express = require("express");
const mongoose = require("mongoose");
const {
  findOrCreateBattingRecord,
  findOrCreateBowlingRecord,
  findScoreBoard,
} = require("./HelpingFunctions.js");
const router = express.Router();
const { Player, Team, BowlingRecord, ScoreBoard, Match } = require("../models/cdb.models.js");

router.post('/finishinning', async (req, res) => {
  const { striker, nonStriker, bowler, battingTeam, bowlingTeam, MatchId } = req.body;

  // Log the received values
  console.log('Request Body:', req.body);

  // Ensure that the required fields are not undefined
  if (!striker || !nonStriker || !bowler || !battingTeam || !bowlingTeam || !MatchId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const strikerEntity = await Player.create([{ pName: striker, pTeam: battingTeam }], { session });
    const nonStrikerEntity = await Player.create([{ pName: nonStriker, pTeam: battingTeam }], { session });
    const bowlerEntity = await Player.create([{ pName: bowler, pTeam: bowlingTeam }], { session });

    const [battingTeamEntity, bowlingTeamEntity] = await Promise.all([
      Team.findByIdAndUpdate(
        battingTeam,
        {
          $addToSet: {
            tPlayers: { $each: [strikerEntity[0]._id, nonStrikerEntity[0]._id] },
          },
        },
        { new: true, session }
      ),
      Team.findByIdAndUpdate(
        bowlingTeam,
        { $addToSet: { tPlayers: bowlerEntity[0]._id } },
        { new: true, session }
      ),
    ]);

    const [scoreBoardEntity] = await ScoreBoard.create(
      [
        {
          TeamBat: battingTeamEntity.tName,
          TeamBowl: bowlingTeamEntity.tName,
         Striker:striker,
          nonStriker:nonStriker,
          Bowler:bowler
        }
      ],
      { session }
    );

    if (!scoreBoardEntity) {
      throw new Error("Scoreboard creation failed");
    }

    console.log('2nd scoreboard ID:', scoreBoardEntity._id.toString());

    await Match.findByIdAndUpdate(
      MatchId,
      { SecondScoreBoard: scoreBoardEntity._id.toString() },
      { session }
    );

    const strikerRecord = await findOrCreateBattingRecord(strikerEntity[0]._id, MatchId);
    const nonstrikerRecord = await findOrCreateBattingRecord(nonStrikerEntity[0]._id, MatchId);
    const bowlerRecord = await findOrCreateBowlingRecord(bowlerEntity[0]._id, MatchId);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      scoreBoardId2: scoreBoardEntity._id.toString(),
      strikerid: strikerEntity[0]._id,
      nonstrikerid: nonStrikerEntity[0]._id,
      bowlerid: bowlerEntity[0]._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error initializing new bowler:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
