const express = require('express');
const multer = require('multer');
const courseController = require('../controller/course-controller');
const enrollmentController = require('../controller/enrollment-controller');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /courses - Create a new course (Instructor only)
router.post('/', upload.single('thumbnail'), courseController.createCourse);

// GET /courses - Get all courses
router.get('/', courseController.getAllCourses);

// GET /courses/instructor/:instructorId - Get courses by instructor
router.get('/instructor/:instructorId', courseController.getCoursesByInstructor);

// GET /courses/:id - Get a single course by ID
router.get('/:id', courseController.getCourseById);

// GET /courses/:id/thumbnail - Get a course's thumbnail
router.get('/:id/thumbnail', courseController.getCourseThumbnail);

// PUT /courses/:id - Update a course
router.put('/:id', upload.single('thumbnail'), courseController.updateCourse);

// DELETE /courses/:id - Delete a course
router.delete('/:id', courseController.deleteCourse);

// ENROLLMENT ROUTES
// POST /courses/enroll - Enroll a learner in a course
router.post('/enroll', enrollmentController.enrollInCourse);

// GET /courses/check-enrollment/:learnerId/:courseId - Check if a learner is enrolled in a course
router.get('/check-enrollment/:learnerId/:courseId', enrollmentController.checkEnrollment);

// GET /courses/enrollments/:learnerId - Get all courses a learner is enrolled in
router.get('/enrollments/:learnerId', enrollmentController.getLearnerEnrollments);

module.exports = router; 