# SMS → X + Threads

Text a phone number, your message gets posted to X and Threads automatically.

## How it works

1. Your brother texts a Twilio number.
2. Twilio hits your `/sms` webhook with the message.
3. The server verifies it's really Twilio and that the sender is whitelisted.
4. It posts the text to X and Threads in parallel.
5. It texts back a confirmation (✅ or ❌ per platform).

## Setup

### 1. Twilio

- Buy a number at [console.twilio.com](https://console.twilio.com) (Phone Numbers → Buy a number).
- Deploy this server somewhere reachable by the internet (Render, Railway, Fly.io, a VPS — anything with a public URL works). For local testing, use `ngrok http 3000`.
- In the Twilio number's config, set **"A message comes in"** webhook to `https://YOUR_DOMAIN/sms`, method `POST`.
- Copy the **Auth Token** from the Twilio console dashboard into `.env`.

### 2. X (Twitter)

- Apply for a developer account at [developer.x.com](https://developer.x.com) and create an app.
- Note: X moved to pay-per-use pricing in 2026 — no free tier, but it's cheap ($0.015/post, no link). Load a small amount of credit in the developer console.
- In your app's **User authentication settings**, enable OAuth 1.0a with **Read and Write** permissions.
- Under **Keys and tokens**, generate:
  - API Key & Secret → `X_API_KEY` / `X_API_SECRET`
  - Access Token & Secret (generate these **after** setting Read+Write, or regenerate them) → `X_ACCESS_TOKEN` / `X_ACCESS_SECRET`

### 3. Threads

- Create a Meta app at [developers.facebook.com](https://developers.facebook.com) and add the **Threads** use case.
- Add your brother's Threads account as a **tester** under App Roles — this lets you post to his account without going through Meta's full App Review process, since only *his* account needs to work.
- Use the Graph API Explorer (or Meta's OAuth flow) to generate a **long-lived** user access token with `threads_basic` + `threads_content_publish` scopes.
- Get his numeric Threads user ID (returned alongside the token, or via `GET /me?fields=id`).
- Put both in `.env` as `THREADS_USER_ID` / `THREADS_ACCESS_TOKEN`.
- ⚠️ Threads tokens expire every 60 days — you'll need to refresh and redeploy periodically, or add a refresh job later.

### 4. Server

```bash
npm install
cp .env.example .env   # fill in real values
npm start
```

### 5. Security

- `ALLOWED_SENDERS` in `.env` whitelists which phone number(s) can trigger a post — set this to your brother's number so randos who find the Twilio number can't post on his behalf.
- The webhook validates the `X-Twilio-Signature` header, so only real Twilio requests are accepted.

## Notes / next steps you might want later

- **Media (photos/video):** both APIs support it, but it's more work — X needs a separate media upload call, Threads needs the media hosted at a public URL first. Happy to add this if he wants to text photos too.
- **Character limits:** Threads caps at 500 chars, X at 280 (unless he has X Premium). Consider truncating or rejecting long texts with a warning reply.
- **Scheduling:** this posts instantly — no queue/scheduling built in.
