const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Team, Player, BattingRecord, Match } = require("../models/cdb.models.js"); // Import necessary models

// Route to get all batting records for a specific match and team
router.get('/battingrecord/:matchid/:battingid', async (req, res) => {
    const { matchid, battingid } = req.params; // Extract match ID and team ID from request parameters

    try {
        // Find all players in the specified team
        const teamPlayers = await Player.find({ pTeam: battingid }).select('_id');
        
        // Extract player IDs from the result
        const playerIds = teamPlayers.map(player => player._id);

        // Find all batting records for the specified match and players
        const battingRecords = await BattingRecord.find({
            match: matchid,
            player: { $in: playerIds }
        }).populate('player', 'pName').populate('match', 'mTeam1 mTeam2'); // Optionally populate player and match details

        // Send the batting records as a response
        res.status(200).json(battingRecords);
    } catch (error) {
        console.error("Error fetching batting records:", error);
        res.status(500).json({ error: "An error occurred while fetching batting records." });
    }
});

module.exports = router;
