const Enrollment = require('../models/enrollment-schema');
const Course = require('../models/course-schema');
const HttpError = require('../models/http-error');

// Enroll learner in a course
const enrollInCourse = async (req, res, next) => {
    try {
        const { learnerId, courseId } = req.body;
        
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ 
            learner: learnerId, 
            course: courseId 
        });
        
        if (existingEnrollment) {
            return next(new HttpError('Learner is already enrolled in this course', 400));
        }
        
        // Create new enrollment
        const newEnrollment = new Enrollment({
            learner: learnerId,
            course: courseId
        });
        
        await newEnrollment.save();
        
        res.status(201).json({ 
            message: 'Enrolled successfully', 
            enrollment: newEnrollment 
        });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        return next(new HttpError('Failed to enroll in course. Please try again.', 500));
    }
};

// Check if learner is enrolled in a specific course
const checkEnrollment = async (req, res, next) => {
    try {
        const { learnerId, courseId } = req.params;
        
        const enrollment = await Enrollment.findOne({ 
            learner: learnerId, 
            course: courseId 
        });
        
        res.status(200).json({ 
            isEnrolled: !!enrollment 
        });
    } catch (error) {
        console.error('Error checking enrollment status:', error);
        return next(new HttpError('Failed to check enrollment status', 500));
    }
};

// Get all courses a learner is enrolled in
const getLearnerEnrollments = async (req, res, next) => {
    try {
        const { learnerId } = req.params;
        
        const enrollments = await Enrollment.find({ learner: learnerId })
            .populate({
                path: 'course',
                select: '-thumbnail',
                populate: {
                    path: 'createdBy',
                    select: 'name'
                }
            });
        
        // Transform the courses to include instructor name
        const courses = enrollments.map(enrollment => {
            const courseObj = enrollment.course.toObject();
            courseObj.instructorName = enrollment.course.createdBy ? enrollment.course.createdBy.name : 'Unknown Instructor';
            return courseObj;
        });
        
        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error fetching learner enrollments:', error);
        return next(new HttpError('Failed to fetch enrolled courses', 500));
    }
};

module.exports = {
    enrollInCourse,
    checkEnrollment,
    getLearnerEnrollments
}; 