const axios = require('axios');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

const oauth = OAuth({
  consumer: {
    key: process.env.X_API_KEY,
    secret: process.env.X_API_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

const token = {
  key: process.env.X_ACCESS_TOKEN,
  secret: process.env.X_ACCESS_SECRET,
};

/**
 * Posts a text-only tweet.
 * @param {string} text
 * @returns {Promise<{id: string, text: string}>}
 */
async function postToX(text) {
  const url = 'https://api.x.com/2/tweets';
  const requestData = { url, method: 'POST' };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  const response = await axios.post(
    url,
    { text },
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data; // { id, text }
}

module.exports = { postToX };
