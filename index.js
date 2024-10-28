const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const instructorRoutes = require('./routes/instructors-routes');
const learnerRoutes = require('./routes/learners-routes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/instructor', instructorRoutes);
app.use('/api/learner', learnerRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
