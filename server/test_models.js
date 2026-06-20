require('dotenv').config({ path: './.env' });
const axios = require('axios');
const { GEMINI_API_BASE } = require('./utils/constants');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const response = await axios.get(`${GEMINI_API_BASE}/models?key=${apiKey}`);
    console.log(response.data.models.map(m => m.name));
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

listModels();
