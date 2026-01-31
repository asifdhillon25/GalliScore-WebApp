const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Player, Team, BowlingRecord,ScoreBoard } = require("../models/cdb.models.js");
router.post('/newbowler', async (req, res) => {
    const { MatchId, newBowlerName, bowlingTeam, scoreBoardId1 } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('Request Body:', req.body);
        console.log('Bowler Name:', newBowlerName);
        console.log('Bowling Team:', bowlingTeam);

        if (!newBowlerName || !bowlingTeam) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create a new player with a session
        const bowler = await Player.create([{ pName: newBowlerName, pTeam: bowlingTeam }], { session });
        await Team.findByIdAndUpdate(bowlingTeam, { $addToSet: { tPlayers: bowler[0]._id } }, { session }).exec();
        await BowlingRecord.create([{ player: bowler[0]._id, match: MatchId }], { session });

        // Handle ScoreBoard update
        const scoreBoard = await ScoreBoard.findById(scoreBoardId1).exec();
        if (scoreBoard) {
            // Make sure to use session only for transactional operations
            scoreBoard.BowlerWickets = 0; // You need to provide real values here
            scoreBoard.BowlerOverNo = 0;   // You need to provide real values here
            scoreBoard.BowlerRun = 0;      // You need to provide real values here
            scoreBoard.Bowler = newBowlerName;

            await scoreBoard.save(); // Save without session
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ bowlerid: bowler[0]._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error initializing new bowler:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});


module.exports = router;