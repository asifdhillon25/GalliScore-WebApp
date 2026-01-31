const express = require('express');
const router = express.Router();

const {  CreateMatchRecord,
    GetMatchRecords,
    GetMatchRecordById,
    UpdateMatchRecord,
    DeleteMatchRecord,
    AddOver} = require('../controllers/MatchRecord.controller');

router.post('/',CreateMatchRecord);
router.get('/',GetMatchRecords);
router.get('/:id',GetMatchRecordById);
router.put('/:id',UpdateMatchRecord);
router.delete('/:id',DeleteMatchRecord);
router.put('/AddOver/:id',AddOver);

module.exports = router;