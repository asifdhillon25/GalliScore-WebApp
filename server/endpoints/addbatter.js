const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Player, Team, BattingRecord,ScoreBoard } = require("../models/cdb.models.js");


router.post('/newbatter', async (req, res) => {
    const { MatchId, newBatterName, BattingTeam,
        scoreBoardId1,} = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        

        if (!newBatterName|| !BattingTeam) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create a new player with a session
        const batter = await Player.create([{ pName: newBatterName, pTeam: BattingTeam }], { session });
        console.log("batter is:",batter);
        await Team.findByIdAndUpdate(BattingTeam, { $addToSet: { tPlayers: batter[0]._id } }, { session }).exec();
        await BattingRecord.create([{ player: batter[0]._id, match: MatchId }], { session });

        // Handle ScoreBoard update
        const scoreBoard = await ScoreBoard.findById(scoreBoardId1).exec();
        if (scoreBoard) {

         
            // Make sure to use session only for transactional operations
            scoreBoard.Striker = newBatterName; // You need to provide real values here
            scoreBoard.StrikerRuns = 0;   // You need to provide real values here
            scoreBoard.StrikerBalls = 0;      // You need to provide real values here
           

            await scoreBoard.save(); // Save without session
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ battingid: batter[0]._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error initializing new bowler:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});


module.exports = router;