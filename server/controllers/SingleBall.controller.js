const { SingleBall } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity } = require("./BaseController.js");

const CreateSingleBall = createEntity(SingleBall);
const GetSingleBalls = getEntities(SingleBall);
const GetSingleBallById = getEntityById(SingleBall);
const UpdateSingleBall = updateEntity(SingleBall);
const DeleteSingleBall = deleteEntity(SingleBall);

module.exports = {
    CreateSingleBall,
    GetSingleBalls,
    GetSingleBallById,
    UpdateSingleBall,
    DeleteSingleBall
};
 