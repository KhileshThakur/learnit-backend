const mongoose = require('mongoose');
const HttpError = require('../models/http-error')


const getDashboard = async (req, res, next) => {
    res.json({"Status": "Success"});
}


exports.getDashboard = getDashboard;
