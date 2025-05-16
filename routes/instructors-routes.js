const express = require('express');
const multer = require('multer');
const instructorAuthController = require('../controller/instructor-auth-controller');
const instructorFunctionController = require('../controller/instructor-function-controller');
const InsPhoto = require('../middleware/InsPhoto');
const Instructor = require('../models/instructor-schema');

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

// Upload instructor profile pic
router.put('/:id/profile-pic', InsPhoto.single('profilePic'), async (req, res) => {
    try {
      const instructor = await Instructor.findById(req.params.id);
      if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
  
      instructor.profilePic = `/uploads/InsProfilePics/${req.file.filename}`;
      await instructor.save();
      res.json(instructor);
    } catch (error) {
      console.error('Error uploading profile pic:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // DELETE /api/instructor/:id/profile-pic
router.delete('/:id/profile-pic', async (req, res) => {
    try {
      const instructor = await Instructor.findById(req.params.id);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
  
      // Optional: Delete image file from local storage
      const fs = require('fs');
      if (instructor.profilePic && fs.existsSync(`uploads/${instructor.profilePic}`)) {
        fs.unlinkSync(`uploads/${instructor.profilePic}`);
      }
  
      instructor.profilePic = "";
      await instructor.save();
  
      res.status(200).json({ message: "Profile picture removed", instructor });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });



//Time capsule routes 
const capsuleInsController = require("../controller/timeCapsuleController/timeCapsuleInsController");
const { saveMeeting , getMeetingsByCapsuleId, getCapsuleParticipants} = require("../controller/timeCapsuleController/capsuleMeetingController");

router.post("/capsule/create", capsuleInsController.createCapsule);
router.get("/capsules/:instructorId", capsuleInsController.getInstructorCapsules);
router.get("/capsule/requests/:capsuleId", capsuleInsController.viewJoinRequests);
router.post("/capsule/handle-request/:capsuleId/:learnerId", capsuleInsController.handleRequest);
router.post("/capsule/meeting/save", saveMeeting);
router.get('/capsule/meeting/:capsuleId', getMeetingsByCapsuleId);
router.get("/capsule/:capsuleId/participants", getCapsuleParticipants);


module.exports = router; 