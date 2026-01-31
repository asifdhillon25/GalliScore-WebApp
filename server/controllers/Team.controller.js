const { Team,Player} = require('../models/cdb.models.js');

const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity,pushIdToSubArray } = require("./BaseController.js");

const CreateTeam = createEntity(Team);
const GetTeams = getEntities(Team, ['tPlayers']);
const GetTeamById = getEntityById(Team, ['tPlayers']);
const UpdateTeam = updateEntity(Team);
const DeleteTeam = deleteEntity(Team);
const AddPlayertoTeam = pushIdToSubArray(Team,"tPlayers")
module.exports = {
    CreateTeam,
    GetTeams,
    GetTeamById,
    UpdateTeam,
    DeleteTeam,
    AddPlayertoTeam
};
