const express = require('express');
const learnerAuthController = require('../controller/learner-auth-controller');
const learnerFunctionController = require('../controller/learner-function-controller');
const router = express.Router();

router.post('/send-otp', learnerAuthController.sendOtp);
router.post('/verify-otp', learnerAuthController.verifyOtp);
router.post('/register', learnerAuthController.registerLearner);
router.post('/auth', learnerAuthController.authLearner);
router.get('/all', learnerFunctionController.getAllLearners);
router.get('/:id', learnerFunctionController.getLearnerById);
router.put('/:id', learnerFunctionController.updateLearner);
router.delete('/:id', learnerFunctionController.deleteLearner);

// TIME CAPSULE
const capsuleLeaController = require("../controller/timeCapsuleController/timeCapsuleLeaController");


router.get("/capsule/explore", capsuleLeaController.exploreCapsules);
router.post("/capsule/request/:capsuleId", capsuleLeaController.sendJoinRequest);
router.get("/capsule/my-capsule/:learnerId", capsuleLeaController.getAcceptedCapsules);

module.exports = router;
