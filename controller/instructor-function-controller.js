const Instructor = require('../models/instructor-schema'); // Adjust the path if necessary



const getAllInstructors = async (req, res) => {
    try {
        const instructors = await Instructor.find();
        res.json(instructors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllInstructorsWithoutFiles = async (req, res) => {
    try {
        const instructors = await Instructor.find().select('-graduation.gresult -postgraduation.presult -resume');
        res.json(instructors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInstructorById = async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        res.json(instructor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Update fields based on the request body
            { new: true, runValidators: true } // Return the updated document
        );

        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        res.json(instructor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findByIdAndDelete(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        res.json({ message: 'Instructor deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllInstructors, getInstructorById, updateInstructor, deleteInstructor, getAllInstructorsWithoutFiles };