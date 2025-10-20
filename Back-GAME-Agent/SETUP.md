# GAME Agent Setup Guide

## Prerequisites

1. **Twitter Developer Account**
   - Login: Amirworks69@gmail.com
   - Password: VeriFiMirage@2025

2. **Required API Keys**
   - GAME API Key: `REMOVED_FROM_GIT_HISTORY`
   - Twitter API credentials (see below)

## Step 1: Get Twitter API Credentials

1. Go to https://developer.twitter.com/
2. Login with: Amirworks69@gmail.com
3. Create a new Project and App
4. Go to your App Settings → Keys and tokens
5. Generate:
   - API Key and Secret
   - Access Token and Secret
   - Bearer Token

## Step 2: Configure Environment

Create a `.env` file in this directory:

```env
# GAME API Key
GAME_API_KEY=REMOVED_FROM_GIT_HISTORY

# Twitter API Credentials
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Backend APIs (update with your actual URLs)
TEXT_DETECTOR_API_URL=http://localhost:5001/api/text
IMAGE_DETECTOR_API_URL=http://localhost:5002/detect

# Optional: OpenAI API Key
OPENAI_API_KEY=your_openai_key_if_needed

# Agent Configuration
AGENT_TWITTER_HANDLE=YourAgentHandle
CHECK_INTERVAL_SECONDS=60
MAX_TWEETS_PER_CHECK=10
AUTO_START=true
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Agent

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker Mode
```bash
docker-compose up -d
```

## Step 5: Test the Agent

### Check Health
```bash
curl http://localhost:3001/health
```

### Start Agent (if not auto-started)
```bash
curl -X POST http://localhost:3001/agent/start
```

### Check Status
```bash
curl http://localhost:3001/agent/status
```

### Execute Single Step (Testing)
```bash
curl -X POST http://localhost:3001/agent/step
```

## How to Use

1. **Tag the agent on Twitter**: Users mention your agent's Twitter handle in a tweet
2. **Agent detects mention**: Automatically fetches new mentions every 60 seconds
3. **Analyzes content**: Extracts text and sends to AI detection backend
4. **Replies with results**: Posts verification results back to the user

## Troubleshooting

### Agent not detecting mentions
- Check Twitter API credentials in `.env`
- Verify the bearer token is valid
- Check rate limits: https://developer.twitter.com/en/docs/twitter-api/rate-limits

### Analysis failing
- Ensure backend API URLs are correct
- Check that backend services are running
- Verify network connectivity

### Reply not posting
- Check Access Token and Secret (needed for posting)
- Verify app has read AND write permissions
- Check Twitter API rate limits

## Monitoring

View logs in real-time:
```bash
# If running with npm
npm run dev

# If running with Docker
docker logs -f game-agent-twitter-verifier
```

## Support

For issues:
1. Check logs for error messages
2. Verify all environment variables are set
3. Test Twitter API credentials manually
4. Ensure backend services are accessible

