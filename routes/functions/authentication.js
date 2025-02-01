const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Read JSON content from environment variables
const credentialsJson = JSON.parse(
  Buffer.from(process.env.CREDENTIALS_JSON_BASE64, 'base64').toString('utf-8')
);
const tokenJson = process.env.TOKEN_JSON_BASE64
  ? JSON.parse(Buffer.from(process.env.TOKEN_JSON_BASE64, 'base64').toString('utf-8'))
  : null;

/**
 * Reads previously authorized credentials from the environment variable.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  if (!tokenJson) {
    return null;
  }
  try {
    return google.auth.fromJSON(tokenJson);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const key = credentialsJson.installed || credentialsJson.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  // Optionally, you can save the token back to an environment variable
  // or a secure storage service instead of writing to a file.
  process.env.TOKEN_JSON_BASE64 = Buffer.from(payload).toString('base64');
}

/**
 * Load or request authorization to call APIs.
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: credentialsJson, // Pass the JSON object directly
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

module.exports = authorize;