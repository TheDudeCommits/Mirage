# GAME Agent - Twitter Content Verifier

Autonomous agent that monitors Twitter mentions and automatically verifies content authenticity using AI detection.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Twitter API:
   - Go to https://developer.twitter.com/
   - Create a new app for account: Amirworks69@gmail.com
   - Generate API keys and tokens
   - Copy credentials to `.env`

3. Set environment variables in `.env`:
```env
GAME_API_KEY=apt-a2b47a408c4ccd7b160ee49c751fd741
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TEXT_DETECTOR_API_URL=http://localhost:5001/api/text
IMAGE_DETECTOR_API_URL=http://localhost:5002/detect
```

4. Start the agent:
```bash
npm run dev
```

## How It Works

1. **Monitor**: Agent continuously checks for Twitter mentions
2. **Extract**: Extracts text content from mentioned tweets
3. **Analyze**: Sends text to AI detection backend
4. **Respond**: Replies to user with verification results

## Architecture

- **Agent**: High-level autonomous planner with goal to verify content
- **Workers**:
  - TwitterMonitor: Tracks mentions and extracts content
  - ContentAnalyzer: Calls AI detection APIs
  - ResponseHandler: Sends verification results back to users
- **Functions**: fetch_mentions, analyze_text, reply_with_result

