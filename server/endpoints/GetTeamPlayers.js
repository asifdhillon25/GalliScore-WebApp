const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { Team, Player } = require("../models/cdb.models.js"); // Import Team and Player models

router.get('/players/:teambat/:teambowl', async (req, res) => {
    const { teambat, teambowl } = req.params; // Extract team IDs from request parameters

    try {
        // Find the teams and populate their player lists
        const [batTeam, bowlTeam] = await Promise.all([
            Team.findById(teambat).populate('tPlayers'),
            Team.findById(teambowl).populate('tPlayers')
        ]);

        if (!batTeam || !bowlTeam) {
            return res.status(404).json({ error: "One or both teams not found." });
        }

        // Extract players from each team
        const teambatplayers = batTeam.tPlayers;
        const teambowlplayers = bowlTeam.tPlayers;

        // Send the players grouped by their teams as a response
        res.status(200).json({
            teambatplayers,
            teambowlplayers
        });
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: "An error occurred while fetching players." });
    }
});

module.exports = router;
