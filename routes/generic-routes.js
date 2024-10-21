const express = require('express');
const { check } = require('express-validator');
const genericController = require('../controller/generic-controller')
const router = express.Router();

router.get('/feedbacks', genericController.getFeedbacks);

router.post('/feedback', 
    [
        check('author').not().isEmpty(),
        check('message').isLength({min: 5})
    ]
    ,genericController.createFeedback);


module.exports = router; 