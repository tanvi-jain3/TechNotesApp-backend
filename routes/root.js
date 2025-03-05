const express = require('express');
const router = express.Router();
const path = require('path');

router.get('^/$|/index(.html)?',(req,res) => {
    console.log("Path module is:", path);
    console.log("Serving:", path.join(__dirname, '..', 'views', 'index.html'));
    res.sendFile(path.join(__dirname,'..','views','index.html'));
});

module.exports = router;