const express = require('express');

const {setlist,getlist,getlistbyid,updatelist,deletelist}=require("../controllers/list.controller.js")
const router = express.Router();

router.get('/',getlist);
router.get('/:id',getlistbyid);
router.post('/',setlist);
router.put('/:id',updatelist);
router.delete('/:id',deletelist);


module.exports = router;




