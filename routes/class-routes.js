const express = require('express');
const classController = require('../controller/class-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(checkAuth);

// Create a class for a specific course
router.post('/courses/:courseId/classes', classController.createClass);

// Get all classes for a specific course
router.get('/courses/:courseId/classes', classController.getClassesByCourse);

// Get a specific class
router.get('/classes/:id', classController.getClassById);

// Update a specific class
router.patch('/classes/:id', classController.updateClass);

// Delete a specific class
router.delete('/classes/:id', classController.deleteClass);

// Get all classes for an instructor (across all courses)
router.get('/instructor/:instructorId/classes', classController.getInstructorClasses);

// Start a class
router.patch('/classes/:id/start', classController.startClass);

// Check if learner can join a class
router.get('/classes/:id/can-join', classController.canJoinClass);

module.exports = router; 