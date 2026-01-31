const { AllOverDetails } = require('../models/cdb.models.js');
const { createEntity, getEntities, getEntityById, updateEntity, deleteEntity,pushIdToSubArray} = require("./BaseController.js");

const CreateAllOverDetails = createEntity(AllOverDetails);
const GetAllOverDetails = getEntities(AllOverDetails, ['eachOverDetail']);
const GetAllOverDetailsById = getEntityById(AllOverDetails, ['eachOverDetail']);
const UpdateAllOverDetails = updateEntity(AllOverDetails);
const DeleteAllOverDetails = deleteEntity(AllOverDetails);
const AddOneOver = pushIdToSubArray(AllOverDetails,"eachOverDetail")


module.exports = {
    CreateAllOverDetails,
    GetAllOverDetails,
    GetAllOverDetailsById,
    UpdateAllOverDetails,
    DeleteAllOverDetails,
    AddOneOver
};
