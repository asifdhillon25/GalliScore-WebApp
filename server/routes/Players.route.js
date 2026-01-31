const express = require('express');
const router = express.Router();
const {  CreatePlayer,GetPlayers,GetPlayersByid,UpdatePlayer,DeletePlayer,AddTeamtoPlayer} = require("../controllers/Player.controller")


router.post('/',CreatePlayer);
router.get('/',GetPlayers);
router.get('/:id',GetPlayersByid);
router.put('/:id',UpdatePlayer);
router.delete('/:id',DeletePlayer);
router.put('/AddTeam/:id',AddTeamtoPlayer);

module.exports = router;