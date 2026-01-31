const express = require('express');
const router = express.Router();

const {  CreateAllOverDetails,
    GetAllOverDetails,
    GetAllOverDetailsById,
    UpdateAllOverDetails,
    DeleteAllOverDetails,
    AddOneOver} = require('../controllers/AllOverDetails.controller');

router.post('/',CreateAllOverDetails);
router.get('/',GetAllOverDetails);
router.get('/:id',GetAllOverDetailsById);
router.put('/:id',UpdateAllOverDetails);
router.delete('/:id',DeleteAllOverDetails);
router.put('/AddOver/:id',AddOneOver);


module.exports = router;