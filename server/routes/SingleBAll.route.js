const express = require('express');
const router = express.Router();

const {   CreateSingleBall,
    GetSingleBalls,
    GetSingleBallById,
    UpdateSingleBall,
    DeleteSingleBall } = require('../controllers/SingleBall.controller');

router.post('/',CreateSingleBall);
router.get('/',GetSingleBalls);
router.get('/:id',GetSingleBallById);
router.put('/:id',UpdateSingleBall);
router.delete('/:id',DeleteSingleBall);


module.exports = router;