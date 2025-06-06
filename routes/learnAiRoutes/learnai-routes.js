const express = require('express');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');

// Your Gemini API Key (ensure you have set this in your .env file)
const API_KEY = process.env.GEMINI_API_KEY;

// Optimize Prompt Route
router.post('/optimize', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const optimizationInstruction = `You are a prompt optimizer. Improve the following prompt for clarity, effectiveness, and specificity. Return only the optimized prompt:\n\n"${userPrompt}"`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: optimizationInstruction,
              },
            ],
          },
        ],
        generationConfig: {
          candidateCount: 1,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: API_KEY,
        },
      }
    );

    const optimizedPrompt = response.data.candidates[0].content.parts[0].text;
    return res.json({ optimizedPrompt });

  } catch (error) {
    console.error('Error optimizing prompt:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to optimize prompt' });
  }
});


// Endpoint to handle AI prompt
router.post('/', async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // API Request to Gemini
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: API_KEY,
        },
      }
    );

    // Check if there is a valid response from Gemini
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    return res.json({ text: aiResponse });

  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
});




module.exports = router;