const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const courseController = require('../controller/courseController/courseController');
const videoController = require('../controller/courseController/videoController');
const enrollController = require('../controller/courseController/enrollController')

router.post('/create', upload.single('thumbnail'), courseController.createCourse);
router.put('/edit/:courseId', courseController.editCourse);
router.delete('/delete/:courseId', courseController.deleteCourse);
router.get('/all', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.get('/instructor/:instructorId', courseController.getInstructorCourses);

router.post('/:courseId/upload-video', upload.single('video'), videoController.uploadVideo);
router.put('/video/edit/:videoId', videoController.editVideo);
router.delete('/video/delete/:courseId/:videoId', videoController.deleteVideo);


router.post('/enroll', enrollController.enrollInCourse);
router.get('/enrolled/:learnerId', enrollController.getEnrolledCourses);

module.exports = router;
