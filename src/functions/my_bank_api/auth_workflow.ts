import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the OAuth2 client with your Google credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL // The redirect URL
);

/**
 * The function that returns authorization headers for API calls
 */
module.exports = async function (dsConfig: any, ctx: any) {
    // Get the access token using OAuth2
    const accessToken = await getAccessToken(dsConfig);

    // Return the headers with Authorization Bearer token
    return {
        'Authorization': `Bearer ${accessToken}`,
        'X-AUTH-KEY': 'your-auth-key', // You can adjust this key as needed
    };
}

/**
 * Function to get the access token from OAuth2. 
 * You can store and refresh tokens as needed, typically in a session or database.
 */
async function getAccessToken(dsConfig: any): Promise<string> {
    // Fetch the refresh token and access token from the session or database
    const tokens = await getTokens(dsConfig);
    
    if (!tokens || !tokens.access_token) {
        throw new Error("Access token not available.");
    }

    // Set the OAuth2 client credentials
    oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // If using refresh tokens
    });

    // If the access token has expired, refresh it
    try {
        const tokenInfo = await oauth2Client.getAccessToken();
        if (typeof tokenInfo.token === 'string') {
            return tokenInfo.token;
        } else {
            throw new Error("Access token is not a valid string.");
        }
    } catch (error) {
        console.error("Error getting or refreshing access token", error);
        throw new Error("Unable to get or refresh access token.");
    }
}

/**
 * Function to simulate fetching stored tokens from a data source
 * In a real implementation, you would retrieve these tokens from your DB or session.
 */
async function getTokens(dsConfig: any): Promise<any> {
    // Simulated token storage, replace with actual logic
    return {
        access_token: process.env.GOOGLE_ACCESS_TOKEN, // The access token stored after OAuth
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN, // Refresh token to refresh access tokens when expired
    };
}
