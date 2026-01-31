

const express = require('express');
const router = express.Router();
const {  CreateTeam,
    GetTeams,
    GetTeamById,
    UpdateTeam,
    DeleteTeam,
AddPlayertoTeam} = require("../controllers/Team.controller")


router.post('/',CreateTeam);
router.get('/',GetTeams);
router.get('/:id',GetTeamById);
router.put('/:id',UpdateTeam);
router.delete('/:id',DeleteTeam);
router.put('/AddPlayer/:id',AddPlayertoTeam);

module.exports = router;