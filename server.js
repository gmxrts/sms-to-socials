require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const { postToX } = require('./lib/postToX');
const { postToThreads } = require('./lib/postToThreads');

const app = express();
app.use(express.urlencoded({ extended: false }));

const ALLOWED_SENDERS = (process.env.ALLOWED_SENDERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.post('/sms', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();

  // 1. Verify the request actually came from Twilio, not a spoofed POST.
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const validRequest = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body
  );

  if (!validRequest) {
    return res.status(403).send('Invalid Twilio signature');
  }

  const from = req.body.From;
  const body = (req.body.Body || '').trim();

  // 2. Only allow whitelisted numbers to trigger a post.
  if (ALLOWED_SENDERS.length && !ALLOWED_SENDERS.includes(from)) {
    twiml.message("This number isn't authorized to post.");
    return res.type('text/xml').send(twiml.toString());
  }

  if (!body) {
    twiml.message("Text can't be empty.");
    return res.type('text/xml').send(twiml.toString());
  }

  // 3. Fire off both posts. Don't let one failure block the other.
  const results = await Promise.allSettled([postToX(body), postToThreads(body)]);
  const [xResult, threadsResult] = results;

  const lines = [];
  lines.push(
    xResult.status === 'fulfilled' ? '✅ Posted to X' : `❌ X failed: ${summarizeError(xResult.reason)}`
  );
  lines.push(
    threadsResult.status === 'fulfilled'
      ? '✅ Posted to Threads'
      : `❌ Threads failed: ${summarizeError(threadsResult.reason)}`
  );

  twiml.message(lines.join('\n'));
  res.type('text/xml').send(twiml.toString());
});

function summarizeError(err) {
  return err?.response?.data?.detail || err?.response?.data?.error?.message || err.message || 'unknown error';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
