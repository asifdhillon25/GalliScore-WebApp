const mongoose = require('mongoose');
const { Player, MatchRecord, AllOverDetails, OneOver, SingleBall, Team, Match } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity,pushIdToSubArray } = require("./BaseController.js");


//player controllers
const CreatePlayer = createEntity(Player);
const GetPlayers = getEntities(Player,['pTeam','pMatchRecords','pOverAllRecord']);
const GetPlayersByid = getEntityById(Player);
const UpdatePlayer = updateEntity(Player);
const DeletePlayer = deleteEntity(Player);
const AddTeamtoPlayer = pushIdToSubArray(Player,"pTeam");
const AddMatchRecord = pushIdToSubArray(Player,"pMatchRecords");
const AddFullRecord = pushIdToSubArray(Player,"pOverAllRecord");

module.exports = 
{
    CreatePlayer,GetPlayers,GetPlayersByid,UpdatePlayer,DeletePlayer,AddTeamtoPlayer,AddFullRecord,AddMatchRecord
}