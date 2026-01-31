const mongoose=require('mongoose')

const handleError = (res, error) => {
    res.status(error.statusCode || 500).json({ message: error.message });
};

const createEntity = (Model) => async (req, res) => {
    try {
        const entity = new Model(req.body);
        await entity.save();
        res.status(201).json(entity);
    } catch (error) {
        handleError(res, error);
    }
};

const getEntities = (Model, populateFields = []) => async (req, res) => {
    try {
        const query = Model.find();
        if (populateFields.length > 0) {
            query.populate(populateFields);
        }
        const entities = await query;
        res.status(200).json(entities);
    } catch (error) {
        handleError(res, error);
    }
};

const getEntityById = (Model, populateFields = []) => async (req, res) => {
    try {
        const entity = await Model.findById(req.params.id);
        if (populateFields.length > 0) {
            await entity.populate(populateFields);
        }
        if (!entity) return res.status(404).json({ message: 'Entity not found' });
        res.status(200).json(entity);
    } catch (error) {
        handleError(res, error);
    }
};

const updateEntity = (Model) => async (req, res) => {
    try {
        const entity = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!entity) return res.status(404).json({ message: 'Entity not found' });
        res.status(200).json(entity);
    } catch (error) {
        handleError(res, error);
    }
};

const deleteEntity = (Model) => async (req, res) => {
    try {
        const entity = await Model.findByIdAndDelete(req.params.id);
        if (!entity) return res.status(404).json({ message: 'Entity not found' });
        res.status(200).json({ message: 'Entity deleted' });
    } catch (error) {
        handleError(res, error);
    }
};

const pushIdToSubArray = (Model, arrayField) => async (req, res) => {
    const  {id} = req.params;
    const { itemId } = req.body;

    console.log(id,itemId);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        // Find the document and update the array field
        const entity = await Model.findByIdAndUpdate(
            id,
            { $addToSet: { [arrayField]: itemId } }, // Use $addToSet to avoid duplicates
            { new: true, runValidators: true }
        );

        if (!entity) {
            return res.status(404).json({ message: 'Entity not found' });
        }

        res.status(200).json(entity);
    } catch (error) {
        handleError(res, error);
    }
};


module.exports = {
    createEntity,
    getEntities,
    getEntityById,
    updateEntity,
    deleteEntity,
    pushIdToSubArray
};
