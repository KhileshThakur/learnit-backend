const Course = require('../../models/Course/course-model');
const Video = require('../../models/Course/video-model');
const { uploadToCloudinary } = require('../../utils/cloudinaryUploader');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, instructorId } = req.body;
    const thumbnailBuffer = req.file.buffer;

    const cloudRes = await uploadToCloudinary(thumbnailBuffer, 'course_thumbnails', 'image');

    const newCourse = await Course.create({
      title,
      description,
      category,
      instructor: instructorId,
      thumbnail: cloudRes.secure_url
    });

    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .populate('videos', 'title videoUrl')    // <--- Add this line
      .select('-__v')
      .sort({ createdAt: -1 });

    return res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate('instructor', 'name email bio')
      .populate({
        path: 'videos',
        select: '_id title videoUrl createdAt'
      });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error('Error getting course by ID:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.editCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnail } = req.body;
    const { courseId } = req.params;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, description, category, thumbnail },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, course: updatedCourse });
  } catch (err) {
    console.error('Edit course error:', err);
    res.status(500).json({ success: false, message: 'Failed to edit course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Delete all videos associated with this course
    await Video.deleteMany({ _id: { $in: course.videos } });

    // Delete the course itself
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: 'Course and associated videos deleted successfully' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};


exports.getInstructorCourses = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const courses = await Course.find({ instructor: instructorId })
      .populate('videos'); // optional: include all video details

    res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error('Error fetching instructor courses:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};