const Video = require('../../models/Course/video-model');
const Course = require('../../models/Course/course-model');
const { uploadToCloudinary } = require('../../utils/cloudinaryUploader');

exports.uploadVideo = async (req, res) => {
  try {
    const { title, instructorId } = req.body;
    const { courseId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    // 1. Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Check instructor ownership
    if (course.instructor.toString() !== instructorId) {
      return res.status(403).json({ error: 'Unauthorized: You are not the course owner' });
    }

    // 3. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, 'course_videos', 'video');

    // 4. Save video entry
    const video = await Video.create({
      title,
      videoUrl: uploadResult.secure_url,
      course: courseId
    });

    // 5. Push video ID to course
    course.videos.push(video._id);
    await course.save();

    return res.status(201).json({ message: 'Video uploaded successfully', video });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
};


// PUT /api/course/video/edit/:videoId


exports.editVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title } = req.body;

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { title },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({ success: true, video: updatedVideo });
  } catch (err) {
    console.error('Edit video error:', err);
    res.status(500).json({ success: false, message: 'Failed to edit video' });
  }
};


// DELETE /api/course/video/delete/:courseId/:videoId

exports.deleteVideo = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;

    // Remove from Video collection
    await Video.findByIdAndDelete(videoId);

    // Remove video reference from Course.videos array
    const course = await Course.findById(courseId);
    course.videos = course.videos.filter(vId => vId.toString() !== videoId);
    await course.save();

    res.status(200).json({ success: true, message: 'Video deleted' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete video' });
  }
};
