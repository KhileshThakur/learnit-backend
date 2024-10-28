// const mongoose = require('mongoose');
// const { validationResult } = require('express-validator')
// const HttpError = require('../models/http-error')
// const Feedback = require('../models/feedback-schema')
// const fs = require('fs')

// const getFeedbacks = async (req, res, next) => {
//     let feedbacks;

//     try{
//         feedbacks = await Feedback.find({});
//     }
//     catch(err){
//         const error = new new HttpError('Fetching feedbacks failed, please try again later.', 500);
//     }

//     if (!feedbacks || feedbacks.length === 0) {
//         const error = new HttpError('No feedbacks found.', 404);
//         return next(error);
//     }
//     res.status(200).json({ feedbacks: feedbacks.map(feedback => feedback.toObject({ getters: true })) });

// }

// const createFeedback = async(req, res, next)=>{
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return next(new HttpError('Invalid input passed, please check your data.', 422));
//     }

//     const { author, message } = req.body;

//     const createdFeedback = new Feedback({
//         author,
//         message
//     });

//     try {
//         const sess = await mongoose.startSession(); 
//         sess.startTransaction();
//         await createdFeedback.save({ session: sess }); 
//         await sess.commitTransaction(); 
//         sess.endSession(); 
//     } catch (err) {
//         console.log(err);
//         const error = new HttpError(
//             'Creating feedback failed, please try again.',
//             500
//         );
//         return next(error);
//     }

//     res.status(201).json({ feedback: createdFeedback.toObject({ getters: true }) });
// }

// exports.getFeedbacks=getFeedbacks;
// exports.createFeedback=createFeedback;