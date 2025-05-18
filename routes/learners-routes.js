const express = require('express');
const learnerAuthController = require('../controller/learner-auth-controller');
const learnerFunctionController = require('../controller/learner-function-controller');
const router = express.Router();
const LeaPhoto = require('../middleware/LeaPhoto');
const Learner = require('../models/learnler-schema');

router.post('/send-otp', learnerAuthController.sendOtp);
router.post('/verify-otp', learnerAuthController.verifyOtp);
router.post('/register', learnerAuthController.registerLearner);
router.post('/auth', learnerAuthController.authLearner);
router.get('/all', learnerFunctionController.getAllLearners);
router.get('/:id', learnerFunctionController.getLearnerById);
router.put('/:id', learnerFunctionController.updateLearner);
router.delete('/:id', learnerFunctionController.deleteLearner);

// Upload learner profile pic
router.put('/:id/profile-pic', LeaPhoto.single('profilePic'), async (req, res) => {
    try {
      const learner = await Learner.findById(req.params.id);
      if (!learner) return res.status(404).json({ message: 'Learner not found' });
  
      learner.profilePic = `/uploads/LeaProfilePics/${req.file.filename}`;
      await learner.save();
      res.json(learner);
    } catch (error) {
      console.error('Error uploading profile pic:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // DELETE /api/learner/:id/profile-pic
router.delete('/:id/profile-pic', async (req, res) => {
    try {
      const learner = await Learner.findById(req.params.id);
      if (!learner) return res.status(404).json({ message: "Learner not found" });
  
      // Optional: Delete image file from local storage
      const fs = require('fs');
      if (learner.profilePic && fs.existsSync(`uploads/${learner.profilePic}`)) {
        fs.unlinkSync(`uploads/${learner.profilePic}`);
      }
  
      learner.profilePic = "";
      await learner.save();
  
      res.status(200).json({ message: "Profile picture removed", learner });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  

// TIME CAPSULE
const capsuleLeaController = require("../controller/timeCapsuleController/timeCapsuleLeaController");


router.get("/capsule/explore", capsuleLeaController.exploreCapsules);
router.post("/capsule/request/:capsuleId", capsuleLeaController.sendJoinRequest);
router.get("/capsule/my-capsule/:learnerId", capsuleLeaController.getAcceptedCapsules);

module.exports = router;
