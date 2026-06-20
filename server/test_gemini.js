require('dotenv').config({ path: './.env' });
const axios = require('axios');
const { GEMINI_API_BASE } = require('./utils/constants');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing with API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: "Say hello world" }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('SUCCESS:', response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error('ERROR RESPONSE:', err.response?.data || err.message);
  }
}

testGemini();
