const Learner = require('../../models/learnler-schema');
const Course = require('../../models/Course/course-model');

exports.enrollInCourse = async (req, res) => {
  try {
    const { learnerId, courseId } = req.body;

    const learner = await Learner.findById(learnerId);
    if (!learner) return res.status(404).json({ error: 'Learner not found' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Check already enrolled
    if (learner.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    learner.enrolledCourses.push(courseId);
    await learner.save();

    return res.status(200).json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enrollment error:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const learnerId = req.params.learnerId;

    const learner = await Learner.findById(learnerId)
      .populate({
        path: 'enrolledCourses',
        populate: [
          { path: 'instructor', select: 'name email' },
          { path: 'videos', select: 'title videoUrl' }
        ]
      });

    if (!learner) return res.status(404).json({ error: 'Learner not found' });

    return res.status(200).json(learner.enrolledCourses);
  } catch (error) {
    console.error('Get enrolled error:', error);
    return res.status(500).json({ error: error.message });
  }
};
