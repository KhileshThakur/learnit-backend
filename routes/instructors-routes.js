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


module.exports = router;