const express = require('express');
const router = express.Router();
const Meeting = require('../models/meeting-schema');
const Learner = require('../models/learnler-schema');
const MeetingController = require('../controller/meeting-controller');


router.post('/request', MeetingController.meetingRequest);

router.get('/:status', MeetingController.fetchMeetingByStatusForLearner);

router.get('/pending/:instructor_id', MeetingController.fetchPendingMeetingForInstructor);

router.put('/:id', MeetingController.updatePendingStatusForInstructor);

router.get('/scheduled/:instructor_id', MeetingController.fetchScheduledMeetingsForInstructor);

router.get('/cancelled/:instructor_id', MeetingController.fetchCancelledMeetingsForInstructor);

module.exports = router;
