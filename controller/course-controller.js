const Course = require('../models/course-schema');
const HttpError = require('../models/http-error');

// Create a new course (Instructor only)
const createCourse = async (req, res, next) => {
    try {
        const { title, description, duration, expertise, price } = req.body;
        const instructorId = req.body.instructorId; // This should come from authenticated user
        
        let thumbnail = null;
        if (req.file) {
            thumbnail = req.file.buffer;
        }
        
        const newCourse = new Course({
            title,
            description,
            createdBy: instructorId,
            thumbnail,
            duration,
            expertise,
            price
        });
        
        await newCourse.save();
        
        // Return success response without the thumbnail binary data
        const courseResponse = {
            ...newCourse._doc,
            thumbnail: newCourse.thumbnail ? true : false
        };
        
        res.status(201).json({ message: 'Course created successfully', course: courseResponse });
    } catch (error) {
        console.error('Error creating course:', error);
        return next(new HttpError('Failed to create course. Please try again.', 500));
    }
};

// Get all courses 
const getAllCourses = async (req, res, next) => {
    try {
        const courses = await Course.find().select('-thumbnail');
        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return next(new HttpError('Failed to fetch courses', 500));
    }
};

// Get courses by instructor ID
const getCoursesByInstructor = async (req, res, next) => {
    try {
        const instructorId = req.params.instructorId;
        const courses = await Course.find({ createdBy: instructorId }).select('-thumbnail');
        
        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        return next(new HttpError('Failed to fetch instructor courses', 500));
    }
};

// Get a single course by ID
const getCourseById = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId).select('-thumbnail');
        
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        res.status(200).json({ course });
    } catch (error) {
        console.error('Error fetching course:', error);
        return next(new HttpError('Failed to fetch course details', 500));
    }
};

// Get course thumbnail
const getCourseThumbnail = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId).select('thumbnail');
        
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        if (!course.thumbnail) {
            return next(new HttpError('Thumbnail not found for this course', 404));
        }
        
        res.set('Content-Type', 'image/jpeg'); // Assuming JPEG; adjust if needed
        res.send(course.thumbnail);
    } catch (error) {
        console.error('Error fetching course thumbnail:', error);
        return next(new HttpError('Failed to fetch thumbnail', 500));
    }
};

// Update course
const updateCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const { title, description, duration, expertise, price } = req.body;
        
        const course = await Course.findById(courseId);
        
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        // Check if instructor is the creator of this course (authorization)
        if (course.createdBy.toString() !== req.body.instructorId) {
            return next(new HttpError('You are not authorized to update this course', 403));
        }
        
        course.title = title;
        course.description = description;
        course.duration = duration;
        course.expertise = expertise;
        course.price = price;
        
        if (req.file) {
            course.thumbnail = req.file.buffer;
        }
        
        await course.save();
        
        // Return success response without the thumbnail binary data
        const courseResponse = {
            ...course._doc,
            thumbnail: course.thumbnail ? true : false
        };
        
        res.status(200).json({ message: 'Course updated successfully', course: courseResponse });
    } catch (error) {
        console.error('Error updating course:', error);
        return next(new HttpError('Failed to update course', 500));
    }
};

// Delete course
const deleteCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const instructorId = req.body.instructorId;
        
        const course = await Course.findById(courseId);
        
        if (!course) {
            return next(new HttpError('Course not found', 404));
        }
        
        // Check if instructor is the creator of this course (authorization)
        if (course.createdBy.toString() !== instructorId) {
            return next(new HttpError('You are not authorized to delete this course', 403));
        }
        
        await Course.findByIdAndDelete(courseId);
        
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        return next(new HttpError('Failed to delete course', 500));
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCoursesByInstructor,
    getCourseById,
    getCourseThumbnail,
    updateCourse,
    deleteCourse
}; 