// Initialize OpenTelemetry tracing if enabled
try {
    if (process.env.OTEL_ENABLED === 'true') {
        require('@godspeedsystems/tracing').initialize();
    }
} catch (error) {
    console.error("OTEL_ENABLED is set, unable to initialize OpenTelemetry tracing.");
    console.error(error);
    process.exit(1);
}

// Importing necessary modules
import Godspeed from "@godspeedsystems/core";
import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

// Create an instance of the Godspeed application
const gsApp = new Godspeed();

// Initialize the Godspeed application
gsApp.initialize()
    .then(() => {
        console.log("Godspeed application initialized successfully.");
    })
    .catch((error: Error) => {
        console.error("Error initializing Godspeed application:", error);
        process.exit(1);
    });

// Optional global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1); // Exit on fatal error
});

// Setup Express server or HTTP server (for Alertron API)
const app = express();

// Use session middleware to store user session securely
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',  // Use a secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },  // Set to true for HTTPS connections
}));

// Middleware to parse JSON requests
app.use(express.json());

// Set up routes for handling API requests
app.get('/', (req, res) => {
    res.send('Welcome to Alertron API!');
});

// OAuth 2.0 route to initiate authentication
app.get('/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BASE_URL}/auth/google/callback`;  // Redirect URI must be set correctly
    const authUrl = 'https://accounts.google.com/o/oauth2/auth?' +
        querystring.stringify({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            access_type: 'offline',
            prompt: 'consent',
        });
    res.redirect(authUrl);
});

// OAuth 2.0 callback route to exchange code for tokens
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code as string;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.BASE_URL}/auth/google/callback`;

    try {
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        // Store tokens securely (e.g., in a session)
        const { access_token, refresh_token } = data;
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;

        // Redirect to a protected route after successful authentication
        res.redirect('/dashboard');
        console.log('Access Token:', access_token);
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Error during OAuth authentication');
    }
});

import { Request, Response, NextFunction } from 'express';

// Extend the session type to include custom properties
declare module 'express-session' {
    interface SessionData {
        access_token: string;
        refresh_token: string;
    }
}

// Asynchronous route handler with correct types
app.get('/auth/google/callback', async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code as string;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.BASE_URL}/auth/google/callback`;

    try {
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        // Store tokens securely (e.g., in a session)
        const { access_token, refresh_token } = data;
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;

        // Redirect to a protected route after successful authentication
        res.redirect('/dashboard');
        console.log('Access Token:', access_token);
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Error during OAuth authentication');
    }
});

// Example protected route (after OAuth2 authentication)
app.get('/dashboard', (req, res) => {
    if (!req.session.access_token) {
        return res.redirect('/auth/google');  // Redirect to Google login if not authenticated
    }
    res.send('Welcome to your dashboard!');
});

// Start the server on the desired port (default: 3001)
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to get data from Google Sheets
async function getSheetData(accessToken: string) {
    try {
        const response = await axios.get('https://sheets.googleapis.com/v4/spreadsheets/your-sheet-id/values/Sheet1', {
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Use the provided access token
            },
        });
        console.log('Sheet Data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error);
        throw error; // Rethrow for handling in the route
    }
}
