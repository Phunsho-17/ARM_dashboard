const express = require('express');
const axios = require('axios');
const qs = require('qs');
const router = express.Router();

let cachedToken = null;
let tokenExpiresAt = 0;

router.get('/get-token', async (req, res) => {
  try {
    const now = Date.now();

    if (cachedToken && now < tokenExpiresAt) {
      return res.json({ token: cachedToken });
    }

    // Prepare URL-encoded POST data
    const postData = qs.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    });

    // POST request with proper headers and data
    const response = await axios.post(process.env.TOKEN_API_URL, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + response.data.expires_in * 1000;

    res.json({ token: cachedToken });
  } catch (error) {
    console.error('Error fetching token:', error.message, error.response?.data || '');
    res.status(500).json({ error: 'Failed to get token' });
  }
});

module.exports = router;
