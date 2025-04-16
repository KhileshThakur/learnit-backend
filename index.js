const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const instructorRoutes = require('./routes/instructors-routes');
const learnerRoutes = require('./routes/learners-routes');
const meetingRoutes = require('./routes/meeting-routes');
const genericRoutes = require('./routes/generic-routes');
const learnAiRoutes = require('./routes/learnAiRoutes/learnai-routes')
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/instructor', instructorRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api', genericRoutes);
app.use('/learnai', learnAiRoutes);

app.use((req, res, next)=>{
    const error = new HttpError('Could not find this Route', 404);
    throw error;
})

app.use((error, req, res, next)=>{
    if(req.file){
        fs.unlink(req.file.path, (err)=>{
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An Unknown error occured !'});
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
