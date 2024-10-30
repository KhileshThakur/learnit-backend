const Learner = require('../models/learnler-schema');


const getAllLearners = async (req, res) => {
    try {
        const learners = await Learner.find();
        res.json(learners);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLearnerById = async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

        res.json(instructor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLearner = async (req, res) => {
    try {
        const learner = await Learner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!learner) {
            return res.status(404).json({ message: 'Learner not found' });
        }
        res.json(learner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteLearner = async (req, res) => {
    try {
        const learner = await Learner.findByIdAndDelete(req.params.id);
        if (!learner) {
            return res.status(404).json({ message: 'Learner not found' });
        }
        res.json({ message: 'Learner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getLearnerById, getAllLearners, updateLearner, deleteLearner };
