const axios = require('axios');

const GRAPH_BASE = 'https://graph.threads.net/v1.0';

/**
 * Posts text to Threads using the create-then-publish container flow.
 * @param {string} text
 * @returns {Promise<{id: string}>}
 */
async function postToThreads(text) {
  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;

  // Step 1: create a media container
  const createRes = await axios.post(`${GRAPH_BASE}/${userId}/threads`, null, {
    params: {
      media_type: 'TEXT',
      text,
      access_token: accessToken,
    },
  });

  const creationId = createRes.data.id;

  // Step 2: publish the container
  const publishRes = await axios.post(`${GRAPH_BASE}/${userId}/threads_publish`, null, {
    params: {
      creation_id: creationId,
      access_token: accessToken,
    },
  });

  return publishRes.data; // { id }
}

module.exports = { postToThreads };
