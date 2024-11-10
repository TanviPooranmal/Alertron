import express from 'express';
import querystring from 'querystring';
import axios from 'axios';

const router = express.Router();
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = 'https://yourapp.com/auth/google/callback';

// Step 1: Route to initiate OAuth flow
router.get('/auth/google', (req, res) => {
  const authUrl = 'https://accounts.google.com/o/oauth2/auth?' + 
    querystring.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent'
    });
  res.redirect(authUrl);
});

// Step 2: Callback route to exchange code for tokens
router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;

  try {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token } = data;
    // Store tokens in your database here or in memory for testing

    res.json({ access_token, refresh_token });

  } catch (error) {
    res.status(500).send('Error retrieving tokens');
  }
});

export default router;
