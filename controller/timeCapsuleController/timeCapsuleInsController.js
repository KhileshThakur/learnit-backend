const Capsule = require("../../models/capsule-schema");

const createCapsule = async (req, res) => {
  try {
    const {
      instructorId,
      name,
      description,
      startDate,
      endDate,
      schedule
    } = req.body;

    const newCapsule = new Capsule({
      instructorId,
      name,
      description,
      startDate,
      endDate,
      schedule,
      joinRequests: [],
      participants: []
    });

    await newCapsule.save();
    res.status(201).json({ message: "Capsule created successfully", capsule: newCapsule });
  } catch (error) {
    console.error("Error creating capsule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getInstructorCapsules = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const capsules = await Capsule.find({ instructorId })
      .populate("participants", "name email")
      .populate("joinRequests.learner", "name email");

    res.status(200).json(capsules);
  } catch (error) {
    console.error("Error fetching capsules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// View Join Requests (Instructor)
const viewJoinRequests = async (req, res) => {
  const { capsuleId } = req.params;
  try {
    const capsule = await Capsule.findById(capsuleId).populate('joinRequests.learner', 'name email');
    if (!capsule) return res.status(404).json({ message: 'Capsule not found' });
    res.json(capsule.joinRequests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept/Reject Join Request
const handleRequest = async (req, res) => {
  try {
    const { capsuleId, learnerId } = req.params;
    const { action } = req.body;

    const capsule = await Capsule.findById(capsuleId);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    const request = capsule.joinRequests.find(r => r.learner && r.learner.toString() === learnerId);

    if (!request) {
      return res.status(404).json({ message: "Join request not found" });
    }

    request.status = action;

    if (action === "accepted") {
      if (!capsule.participants.includes(learnerId)) {
        capsule.participants.push(learnerId);
      }
    }

    await capsule.save();
    res.status(200).json({ message: `Request ${action}` });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createCapsule, getInstructorCapsules, viewJoinRequests, handleRequest };