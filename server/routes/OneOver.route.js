const express = require('express');
const router = express.Router();

const {   CreateOneOver,
    GetOneOvers,
    GetOneOverById,
    UpdateOneOver,
    DeleteOneOver,
    AddBall} = require('../controllers/OneOver.controller');

router.post('/',CreateOneOver);
router.get('/',GetOneOvers);
router.get('/:id',GetOneOverById);
router.put('/:id',UpdateOneOver);
router.delete('/:id',DeleteOneOver);
router.put('/AddBall/:id',AddBall);

module.exports = router;