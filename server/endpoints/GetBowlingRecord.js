const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Team, Player, BowlingRecord, Match } = require("../models/cdb.models.js"); // Import models

// Route to get all players with bowling records for a specific match
router.get('/bowlingrecord/:matchid/:bowlingid', async (req, res) => {
    const { matchid, bowlingid } = req.params; // Extract match ID and bowling team ID from request parameters

    try {
        // Find all bowling records for the given match ID and bowling team ID
        const bowlingRecords = await BowlingRecord.find({
            match: matchid,
            player: { $in: await Player.find({ pTeam: bowlingid }).select('_id') } // Find players in the specified team
        })
        .populate('player', 'pName');// Populate player names
        

        // Check if any bowling records were found
        if (!bowlingRecords || bowlingRecords.length === 0) {
            return res.status(404).json({ error: "No bowling records found for this match and team." });
        }

        // Send the bowling records as a response
        res.status(200).json(bowlingRecords);
    } catch (error) {
        console.error("Error fetching bowling records:", error);
        res.status(500).json({ error: "An error occurred while fetching bowling records." });
    }
});

module.exports = router;
