import axios from 'axios';

export async function fetchDataFromSheet(spreadsheetId: string, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/1UaTdThEFKzAMb1SoolJMQzMlkVAd0d8Yv1Pc9few4bw/values/Sheet1!A1:D5`;
  
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}

export async function refreshAccessToken(refreshToken: string) {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  return data.access_token;
}
