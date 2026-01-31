const { MatchRecord } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity ,pushIdToSubArray} = require("./BaseController.js");

const CreateMatchRecord = createEntity(MatchRecord);
const GetMatchRecords = getEntities(MatchRecord, ['mOverDetails']);
const GetMatchRecordById = getEntityById(MatchRecord, ['mOverDetails']);
const UpdateMatchRecord = updateEntity(MatchRecord);
const DeleteMatchRecord = deleteEntity(MatchRecord);
const AddOver = pushIdToSubArray(MatchRecord,"mOverDetails");

module.exports = {
    CreateMatchRecord,
    GetMatchRecords,
    GetMatchRecordById,
    UpdateMatchRecord,
    DeleteMatchRecord,
    AddOver
};
