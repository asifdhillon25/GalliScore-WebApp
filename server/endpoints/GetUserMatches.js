const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Match } = require("../models/cdb.models.js"); // Import necessary models

// Route to get all matches for a specific user
router.get('/allmatches/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find matches where the user ID matches the provided ID
        const matches = await Match.find({ Userid: userId }).populate('mTeam1 mTeam2 Toss BattingRecords BowlingRecords FirstScoreBoard SecondScoreBoard');
                console.log(matches);
        // Send the matches as a response
        res.status(200).json(matches);
    } catch (error) {
        // Handle any errors that occur during the query
        console.error("Error fetching matches:", error);
        res.status(500).json({ message: "Error fetching matches", error });
    }
});

module.exports = router;
