const Class = require('../models/class-schema');
const Course = require('../models/course-schema');
const HttpError = require('../models/http-error');

// Create a new class for a course
const createClass = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const { title, description, date, startTime, endTime, meetingLink, streamInfo } = req.body;
        
        // Verify the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        // Verify the instructor owns this course
        if (course.createdBy.toString() !== req.body.instructorId) {
            return next(new HttpError('You are not authorized to add classes to this course', 403));
        }
        
        const newClass = new Class({
            courseId,
            title,
            description,
            date,
            startTime,
            endTime,
            meetingLink,
            streamInfo
        });
        
        await newClass.save();
        
        res.status(201).json({ 
            message: 'Class created successfully', 
            class: newClass 
        });
    } catch (error) {
        console.error('Error creating class:', error);
        return next(new HttpError('Failed to create class. Please try again.', 500));
    }
};

// Get all classes for a course
const getClassesByCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        
        // Verify the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        const classes = await Class.find({ courseId }).sort({ date: 1, startTime: 1 });
        
        res.status(200).json({ classes });
    } catch (error) {
        console.error('Error fetching classes:', error);
        return next(new HttpError('Failed to fetch classes', 500));
    }
};

// Get a single class by ID
const getClassById = async (req, res, next) => {
    try {
        const classId = req.params.id;
        const classObject = await Class.findById(classId);
        
        if (!classObject) {
            return next(new HttpError('Class not found', 404));
        }
        
        res.status(200).json({ class: classObject });
    } catch (error) {
        console.error('Error fetching class:', error);
        return next(new HttpError('Failed to fetch class details', 500));
    }
};

// Update a class
const updateClass = async (req, res, next) => {
    try {
        const classId = req.params.id;
        const { title, description, date, startTime, endTime, meetingLink, streamInfo } = req.body;
        
        const classObject = await Class.findById(classId);
        
        if (!classObject) {
            return next(new HttpError('Class not found', 404));
        }
        
        // Verify the course exists and instructor owns it
        const course = await Course.findById(classObject.courseId);
        if (!course) {
            return next(new HttpError('Associated course not found', 404));
        }
        
        if (course.createdBy.toString() !== req.body.instructorId) {
            return next(new HttpError('You are not authorized to update this class', 403));
        }
        
        classObject.title = title;
        classObject.description = description;
        classObject.date = date;
        classObject.startTime = startTime;
        classObject.endTime = endTime;
        classObject.meetingLink = meetingLink;
        classObject.streamInfo = streamInfo;
        
        await classObject.save();
        
        res.status(200).json({ 
            message: 'Class updated successfully', 
            class: classObject 
        });
    } catch (error) {
        console.error('Error updating class:', error);
        return next(new HttpError('Failed to update class', 500));
    }
};

// Delete a class
const deleteClass = async (req, res, next) => {
    try {
        const classId = req.params.id;
        
        const classObject = await Class.findById(classId);
        
        if (!classObject) {
            return next(new HttpError('Class not found', 404));
        }
        
        // Verify the course exists and instructor owns it
        const course = await Course.findById(classObject.courseId);
        if (!course) {
            return next(new HttpError('Associated course not found', 404));
        }
        
        if (course.createdBy.toString() !== req.body.instructorId) {
            return next(new HttpError('You are not authorized to delete this class', 403));
        }
        
        await Class.findByIdAndDelete(classId);
        
        res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        return next(new HttpError('Failed to delete class', 500));
    }
};

// Get all classes for an instructor (across all courses)
const getInstructorClasses = async (req, res, next) => {
    try {
        const instructorId = req.params.instructorId;
        
        // Find all courses created by this instructor
        const courses = await Course.find({ createdBy: instructorId }).select('_id title');
        
        if (!courses.length) {
            return res.status(200).json({ classes: [] });
        }
        
        // Get course IDs
        const courseIds = courses.map(course => course._id);
        
        // Find all classes for these courses
        const classes = await Class.find({ 
            courseId: { $in: courseIds } 
        }).sort({ date: 1, startTime: 1 });
        
        // Construct a response with course information
        const classesWithCourseInfo = [];
        
        for (const classItem of classes) {
            const course = courses.find(c => c._id.toString() === classItem.courseId.toString());
            classesWithCourseInfo.push({
                ...classItem._doc,
                courseName: course ? course.title : 'Unknown Course'
            });
        }
        
        res.status(200).json({ classes: classesWithCourseInfo });
    } catch (error) {
        console.error('Error fetching instructor classes:', error);
        return next(new HttpError('Failed to fetch instructor classes', 500));
    }
};

// Start a class
const startClass = async (req, res, next) => {
    try {
        const classId = req.params.id;
        const classDoc = await Class.findById(classId);
        
        if (!classDoc) {
            return next(new HttpError('Class not found', 404));
        }
        
        // Verify the instructor owns the related course
        const course = await Course.findById(classDoc.courseId);
        if (!course) {
            return next(new HttpError('Associated course not found', 404));
        }
        
        if (course.createdBy.toString() !== req.body.instructorId) {
            return next(new HttpError('You are not authorized to start this class', 403));
        }
        
        // Update class to mark it as live
        classDoc.isLive = true;
        classDoc.startedAt = new Date();
        
        // Ensure there's a meeting link for the classroom
        if (!classDoc.meetingLink) {
            classDoc.meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/classroom/${classId}`;
        }
        
        await classDoc.save();
        
        res.status(200).json({ 
            message: 'Class started successfully', 
            class: classDoc 
        });
    } catch (error) {
        console.error('Error starting class:', error);
        return next(new HttpError('Failed to start class', 500));
    }
};

// Add a function to check if learners can join a class
const canJoinClass = async (req, res, next) => {
    try {
        const classId = req.params.id;
        const classDoc = await Class.findById(classId);
        
        if (!classDoc) {
            return next(new HttpError('Class not found', 404));
        }
        
        // Class must be live first
        if (!classDoc.isLive) {
            return res.status(200).json({
                canJoin: false,
                message: 'Class has not been started by the instructor yet'
            });
        }
        
        // Combine date and startTime to check if it's time for learners to join
        const classDate = new Date(classDoc.date);
        const [hours, minutes] = classDoc.startTime.split(':').map(Number);
        classDate.setHours(hours, minutes, 0, 0);
        
        const currentTime = new Date();
        
        // Check if current time is >= scheduled start time for learners
        if (currentTime < classDate) {
            // Calculate minutes remaining
            const minutesRemaining = Math.ceil((classDate - currentTime) / (1000 * 60));
            
            return res.status(200).json({
                canJoin: false,
                message: `Class will be available to join in ${minutesRemaining} minute(s)`,
                scheduledTime: classDate
            });
        }
        
        // If class is live and it's time, learners can join
        return res.status(200).json({
            canJoin: true,
            meetingLink: classDoc.meetingLink,
            message: 'You can join the class now'
        });
        
    } catch (error) {
        console.error('Error checking join status:', error);
        return next(new HttpError('Failed to check join status', 500));
    }
};

module.exports = {
    createClass,
    getClassesByCourse,
    getClassById,
    updateClass,
    deleteClass,
    getInstructorClasses,
    startClass,
    canJoinClass
}; 