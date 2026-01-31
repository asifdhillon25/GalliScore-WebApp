const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Match } = require("../models/cdb.models.js");

router.get('/MatchData', async (req, res) => {
    const { MatchId } = req.query; // Use req.query for GET parameters
    try {
        console.log('Request Query:', req.query);

        // Ensure MatchId is provided
        if (!MatchId) {
            return res.status(400).json({ error: 'MatchId is required' });
        }

        // Fetch match data
        const match = await Match.findById(MatchId).exec();

        // Check if match is found
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Respond with the relevant data
        res.status(200).json({
            NoOfWickets: match.NoOfWickets,
            NoOfOvers: match.NoOfOvers
        });
    } catch (error) {
        console.error("Error fetching match data:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});



module.exports = router;