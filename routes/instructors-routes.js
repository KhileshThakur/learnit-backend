const express = require('express');
const multer = require('multer');
const instructorAuthController = require('../controller/instructor-auth-controller');
const instructorFunctionController = require('../controller/instructor-function-controller');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/send-otp', instructorAuthController.sendOtp);
router.post('/verify-otp', instructorAuthController.verifyOtp);
router.post('/register', upload.fields([{ name: 'gresult' }, { name: 'presult' }, { name: 'resume' }]), instructorAuthController.registerInstructor);
router.post('/auth', instructorAuthController.authenticateInstructor);
router.get('/all', instructorFunctionController.getAllInstructorsWithoutFiles);
router.get('/:id', instructorFunctionController.getInstructorById);
router.put('/:id', instructorFunctionController.updateInstructor);
router.delete('/:id', instructorFunctionController.deleteInstructor);



//Time capsule routes 
const capsuleInsController = require("../controller/timeCapsuleController/timeCapsuleInsController");


router.post("/capsule/create", capsuleInsController.createCapsule);
router.get("/capsules/:instructorId", capsuleInsController.getInstructorCapsules);
router.get("/capsule/requests/:capsuleId", capsuleInsController.viewJoinRequests);
router.post("/capsule/handle-request/:capsuleId/:learnerId", capsuleInsController.handleRequest);


module.exports = router; 