const express = require('express');
const router = express.Router();

const {  CreateMatch,
    GetMatches,
    GetMatchById,
    UpdateMatch,
    DeleteMatch,
    AddTeams,
    AddScoreboard} = require('../controllers/Match.controller');

router.post('/',CreateMatch);
router.get('/',GetMatches);
router.get('/:id',GetMatchById);
router.put('/:id',UpdateMatch);
router.delete('/:id',DeleteMatch);
router.put('/AddTeam/:id',AddTeams);
router.put('/ScoreBoard/:id',AddScoreboard);

module.exports = router;