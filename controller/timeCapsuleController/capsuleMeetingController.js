const CapsuleMeeting = require("../../models/capsule-meetings");
const Capsule = require("../../models/capsule-schema");

const saveMeeting = async (req, res) => {
    try {
        const { capsuleId, roomName, roomId, joinUrl, scheduledFor } = req.body;

        if (!capsuleId || !roomName || !roomId || !joinUrl || !scheduledFor) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newMeeting = new CapsuleMeeting({
            capsuleId,
            roomName,
            roomId,
            joinUrl,
            scheduledFor
        });

        await newMeeting.save();
        res.status(201).json({ success: true, meeting: newMeeting });
    } catch (err) {
        console.error("Error saving capsule meeting:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getMeetingsByCapsuleId = async (req, res) => {
    const { capsuleId } = req.params;

    try {
        const now = new Date();

        const meetings = await CapsuleMeeting.find({
            capsuleId,
            scheduledFor: { $gte: now }  // only upcoming meetings
        }).sort({ scheduledFor: 1 });   // sort by closest date first

        res.status(200).json({ success: true, meetings });
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ success: false, message: "Error fetching meetings" });
    }
};

const getCapsuleParticipants = async (req, res) => {
    const { capsuleId } = req.params;
  
    try {
      const capsule = await Capsule.findById(capsuleId)
        .populate({
          path: "participants",
          select: "name email phone college university department linkedin portfolio",
        })
        .populate({
          path: "instructorId",
          select: "name email phone expertise teachexp linkedin portfolio",
        });
  
      if (!capsule) {
        return res.status(404).json({ success: false, message: "Capsule not found" });
      }
  
      res.status(200).json({
        success: true,
        instructor: capsule.instructorId,
        participants: capsule.participants,
      });
    } catch (err) {
      console.error("Error fetching participants:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };


module.exports = { saveMeeting, getMeetingsByCapsuleId, getCapsuleParticipants };
