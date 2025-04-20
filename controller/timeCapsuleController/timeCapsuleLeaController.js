const Capsule = require("../../models/capsule-schema");


const exploreCapsules = async (req, res) => {
    try {
        const capsules = await Capsule.find();
        res.json(capsules);
    }
    catch(error) {
        console.error("Error fetching capsules:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Send Join Request
const sendJoinRequest = async (req, res) => {
    const { capsuleId } = req.params;
    const { learnerId } = req.body;
  
    try {
      const capsule = await Capsule.findById(capsuleId);
  
      if (!capsule) {
        return res.status(404).json({ message: 'Capsule not found' });
      }
  
      const alreadyRequested = capsule.joinRequests.some(r => r.learner.toString() === learnerId);
      const alreadyParticipant = capsule.participants.some(p => p.toString() === learnerId);
  
      if (alreadyRequested || alreadyParticipant) {
        return res.status(400).json({ message: 'Already requested or joined' });
      }
  
      capsule.joinRequests.push({ learner: learnerId, status: 'pending' });
      await capsule.save();
  
      res.status(200).json({ message: 'Join request sent successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Get Capsules where learner's request was accepted
const getAcceptedCapsules = async (req, res) => {
  const { learnerId } = req.params;

  try {
    const capsules = await Capsule.find({
      participants: learnerId
    }).populate("instructorId", "name email");

    res.status(200).json(capsules);
  } catch (err) {
    console.error("Error fetching accepted capsules:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { exploreCapsules,  sendJoinRequest, getAcceptedCapsules};