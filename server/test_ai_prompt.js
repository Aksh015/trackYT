require('dotenv').config({ path: './.env' });
const axios = require('axios');
const { GEMINI_API_BASE } = require('./utils/constants');

const prompt = `You are a YouTube analytics assistant. Analyze the following channel activity data and provide a highly detailed, descriptive, and insightful summary (about 4-6 sentences). 
Instead of just repeating the numbers, provide context. For example, if there are new videos, mention their titles and discuss the upload frequency. If there are title or thumbnail changes, explain what this suggests (e.g., A/B testing, optimizing for CTR). Make it sound like an expert analyst's report.

Channel: Krish Naik
Period: Last 30 days

Statistics:
- New videos uploaded: 1
- Title changes: 0
- Thumbnail changes: 0
- Channel renames: 0
- Profile picture changes: 0
- Average upload gap: 0 days

Recent Activity Log:
  - 6/20/2026: Uploaded new video "Mastering AI"

Please write the summary paragraph directly without conversational filler.`;

async function testPrompt() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    console.log('SUCCESS:', response.data.candidates[0].content.parts[0].text);
    console.log('Finish Reason:', response.data.candidates[0].finishReason);
  } catch (err) {
    console.error('ERROR RESPONSE:', err.response?.data || err.message);
  }
}

testPrompt();
