const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const turnController = require('../controller/turnController');

// Protected route that requires authentication
router.get('/token', checkAuth, turnController.getTurnCredentials);

module.exports = router; 