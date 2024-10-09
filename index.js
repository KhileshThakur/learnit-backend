const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

app.get('/api', (req, res) => {
  res.json({ message: 'Hello!!\nThis is LearnIt : Unified Learning and Engagement Platform' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
