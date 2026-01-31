const { Match, Team } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity,pushIdToSubArray } = require("./BaseController.js");

const CreateMatch = createEntity(Match);
const GetMatches = getEntities(Match, ['mTeams', 'mScoreBoard']);
const GetMatchById = getEntityById(Match);
const UpdateMatch = updateEntity(Match);
const DeleteMatch = deleteEntity(Match);
const AddTeams = pushIdToSubArray(Match,"mTeams"); 
const AddScoreboard = pushIdToSubArray(Match,"mScoreBoard"); 


module.exports = {
    CreateMatch,
    GetMatches,
    GetMatchById,
    UpdateMatch,
    DeleteMatch,
    AddTeams,
    AddScoreboard
};
