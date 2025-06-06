const Meeting = require('../models/meeting-schema');
const Learner = require('../models/learnler-schema')
const axios = require('axios');

const meetingRequest = async (req, res) => {
    const { learner_id, instructor_id, subject, topic, time, objective } = req.body; // Extract learner_id from request body
    try {
        const meetingRequest = new Meeting({
            learner_id,
            instructor_id,
            subject,
            topic,
            time,
            objective,
            status: 'pending'
        });
        await meetingRequest.save();
        res.status(201).json({ message: 'Meeting request created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const fetchMeetingByStatusForLearner = async (req, res) => {
    const { learner_id } = req.query; // Extract learner ID from query parameter
    const { status } = req.params; // Extract status from URL

    // Ensure that both learner_id and status are provided
    if (!learner_id) {
        return res.status(400).json({ message: 'Learner ID is required.' });
    }

    try {
        // Fetch meetings only for the specified learner and status
        const meetings = await Meeting.find({ learner_id, status })
            .populate('instructor_id', 'name email qualification expertise teachexp');
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ message: 'Server error while fetching meetings.' });
    }
}

const fetchPendingMeetingForInstructor = async (req, res) => {
    const { instructor_id } = req.params; // Extract instructor ID from URL

    try {
        // Find all meetings with the instructor_id and status 'pending'
        const meetings = await Meeting.find({ instructor_id, status: 'pending' })
            .populate('learner_id', 'name email'); // Populate learner details (you can customize fields as needed)

        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const updatePendingStatusForInstructor = async (req, res) => {
    const { id } = req.params;
    const { action, time, reason } = req.body;

    try {
        const updateData = {};
        if (action === 'schedule') {
            // Call external API to create video room
            const response = await axios.post('https://meet-up-server-xklt.onrender.com/create-meet');
            if (!response.data.success) {
                return res.status(500).json({ message: 'Failed to create video room' });
            }
            const { roomName, roomId, joinUrl } = response.data;
            updateData.status = 'scheduled';
            updateData.time = time;
            updateData.roomName = roomName;
            updateData.roomId = roomId;
            updateData.joinUrl = joinUrl;
        } else if (action === 'cancel') {
            updateData.status = 'rejected';
            updateData.rejectReason = reason;
        }

        const updatedMeeting = await Meeting.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updatedMeeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const fetchScheduledMeetingsForInstructor = async (req, res) => {
    const { instructor_id } = req.params;
    try {
        const meetings = await Meeting.find({ instructor_id, status: 'scheduled' })
            .populate('learner_id', 'name email');
        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const fetchCancelledMeetingsForInstructor = async (req, res) => {
    const { instructor_id } = req.params;
    try {
        const meetings = await Meeting.find({ instructor_id, status: 'rejected' })
            .populate('learner_id', 'name email');
        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    meetingRequest,
    fetchMeetingByStatusForLearner,
    fetchPendingMeetingForInstructor,
    updatePendingStatusForInstructor,
    fetchScheduledMeetingsForInstructor,
    fetchCancelledMeetingsForInstructor
};