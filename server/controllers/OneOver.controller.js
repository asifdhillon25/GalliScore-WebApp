const { OneOver } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity,pushIdToSubArray } = require("./BaseController.js");

const CreateOneOver = createEntity(OneOver);
const GetOneOvers = getEntities(OneOver, ['BallDetail']);
const GetOneOverById = getEntityById(OneOver, ['BallDetail']);
const UpdateOneOver = updateEntity(OneOver);
const DeleteOneOver = deleteEntity(OneOver);
const AddBall = pushIdToSubArray(OneOver,"BallDetail");


module.exports = {
    CreateOneOver,
    GetOneOvers,
    GetOneOverById,
    UpdateOneOver,
    DeleteOneOver,
    AddBall
};
