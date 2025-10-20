# 🚀 Quick Start Guide - GAME Twitter Agent

## Current Status ✅

- ✅ GAME Agent code is complete
- ✅ Twitter integration ready
- ✅ Backend integration configured
- ⏳ **Next:** Get Twitter API credentials

---

## Step-by-Step Setup

### Step 1: Get Twitter API Credentials (Required)

1. **Go to**: https://developer.twitter.com/
2. **Login** with your Twitter account credentials:
   - Email: `Amirworks69@gmail.com`
   - Password: `VeriFiMirage@2025`

3. **Create Project & App**:
   - Click "Projects & Apps" → "Create Project"
   - Name: "AskMira Agent" (or any name)
   - Use case: "Making a bot"
   - Create an App under the project

4. **Generate API Keys**:
   - Go to your App → "Keys and tokens" tab
   - Click "Generate" for each:
     - ✅ **API Key** (also called Consumer Key)
     - ✅ **API Key Secret** (Consumer Secret)  
     - ✅ **Bearer Token**
     - ✅ **Access Token**
     - ✅ **Access Token Secret**
   - **IMPORTANT**: Copy these immediately - you won't see them again!

5. **Set App Permissions** (CRITICAL):
   - Go to "Settings" tab
   - Find "User authentication settings" → Click "Set up"
   - App permissions: Select **"Read and Write"** (NOT just Read!)
   - Save changes
   - After saving, go back to "Keys and tokens" and **regenerate Access Token & Secret**

### Step 2: Configure the Agent

Edit `/Back-GAME-Agent/.env` and replace the placeholder values:

```env
GAME_API_KEY=REMOVED_FROM_GIT_HISTORY  # Already set ✅

# Add your Twitter credentials:
TWITTER_API_KEY=paste_your_api_key_here
TWITTER_API_SECRET=paste_your_api_secret_here
TWITTER_ACCESS_TOKEN=paste_your_access_token_here
TWITTER_ACCESS_SECRET=paste_your_access_secret_here
TWITTER_BEARER_TOKEN=paste_your_bearer_token_here

# Your agent's Twitter handle:
AGENT_TWITTER_HANDLE=YourActualTwitterHandle
```

### Step 3: Start the AI Detection Backend

```bash
# Terminal 1: Start the AI detection backend
cd /Users/vladyslavaka/Downloads/twitter/Back-AI-Text-Detector

# Option A: Using uv (if available)
uv run python main.py

# Option B: Using pip
pip install -r requirements.txt
python main.py

# It should start on port 3000 or 5001
# You'll see: "Running on http://0.0.0.0:5001"
```

### Step 4: Start the GAME Agent

```bash
# Terminal 2: Start the GAME agent
cd /Users/vladyslavaka/Downloads/twitter/Back-GAME-Agent

# Start the agent
npm run dev

# You should see:
# ✅ Twitter client initialized
# 🎯 Starting autonomous agent...
# 1:xx:xx PM [express] serving on localhost:3001
```

---

## Testing the Agent

### Test 1: Check Agent Status

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "agent": {
    "isRunning": true,
    ...
  }
}
```

### Test 2: Tag Agent on Twitter

1. **Tweet something** from any Twitter account:
   ```
   @YourAgentHandle can you verify this text?
   "This is a test message to check if AI generated it."
   ```

2. **Wait 60 seconds** (agent checks every minute)

3. **Check logs** - you should see:
   ```
   📥 Fetched 1 new mentions
   🔍 Analyzing content from tweet...
   ✅ Analysis complete: Human-Written (85% confidence)
   📤 Successfully replied to tweet...
   ```

4. **See reply** - Agent will reply on Twitter:
   ```
   ✅ Verification Result for @username
   
   Classification: Human-Written
   Confidence: 85%
   
   This content appears to be human-written.
   ```

---

## Troubleshooting

### Agent won't start

**Error**: `Twitter client not initialized`
- ✅ Check `.env` file exists in `/Back-GAME-Agent/`
- ✅ Verify all Twitter credentials are filled in
- ✅ Make sure Bearer Token is valid

**Error**: `Missing required environment variables`
- ✅ Run: `cat .env` to check file contents
- ✅ Ensure `GAME_API_KEY` and `TWITTER_BEARER_TOKEN` are set

### Agent not detecting mentions

**Problem**: No new mentions logged
- ✅ Verify your Twitter handle in `.env` is correct
- ✅ Tag the agent in a test tweet
- ✅ Wait 60 seconds for the next check
- ✅ Check Twitter API rate limits: https://developer.twitter.com/en/docs/twitter-api/rate-limits

### Agent can't reply

**Problem**: Analysis completes but no reply posted
- ✅ Ensure Access Token & Secret are set in `.env`
- ✅ Verify app has **Read and Write** permissions (not just Read)
- ✅ Regenerate Access Token/Secret after changing permissions
- ✅ Check if you hit Twitter rate limits for posting

### Backend not responding

**Error**: `ECONNREFUSED` when analyzing
- ✅ Ensure backend is running: `cd Back-AI-Text-Detector && python main.py`
- ✅ Check port: `lsof -i:5001` should show Python process
- ✅ Test manually:
  ```bash
  curl -X POST http://localhost:5001/api/detect \
    -H "Content-Type: application/json" \
    -d '{"text": "test message"}'
  ```

---

## What Happens Automatically

Once running, the agent will:

1. **Every 60 seconds**:
   - Check Twitter for new mentions
   - Find tweets tagging your agent

2. **For each mention**:
   - Extract the text content
   - Send to AI detection backend
   - Get classification (Human/AI-Generated)
   - Calculate confidence score

3. **Reply automatically**:
   - Post verification results
   - Include confidence percentage
   - Clear, helpful format

---

## Monitoring

### View Live Logs

```bash
# In the terminal running the agent
# You'll see real-time activity:
📥 Fetched X new mentions
🔍 Analyzing content...
✅ Analysis complete: Human-Written (85%)
📤 Successfully replied...
```

### Check Agent Status

```bash
# Check if agent is running
curl http://localhost:3001/agent/status

# Manual step (for testing)
curl -X POST http://localhost:3001/agent/step
```

---

## Next Steps

### Once Running Successfully

1. **Monitor performance**: Watch logs for any errors
2. **Test with different content**: Try various text types
3. **Adjust settings**: Edit `.env` to change check interval
4. **Deploy to production**: Use Docker for stable deployment

### Future Enhancements

- Image analysis support
- Thread conversation handling  
- Rate limiting per user
- Analytics dashboard
- Multi-language support

---

## Need Help?

1. **Check logs**: Look for specific error messages
2. **Review documentation**:
   - `/Back-GAME-Agent/INTEGRATION_COMPLETE.md` - Full guide
   - `/Back-GAME-Agent/SETUP.md` - Detailed setup
   - `/GAME_AGENT_SUMMARY.md` - Overview

3. **Test components individually**:
   - Backend: `curl http://localhost:5001`
   - Agent API: `curl http://localhost:3001/health`
   - Twitter API: Use Twitter Dev Portal's test tools

---

## 🎉 Ready?

Once you have your Twitter API credentials:
1. Add them to `.env`
2. Start backend (Terminal 1)
3. Start agent (Terminal 2)
4. Tag your agent on Twitter
5. Watch it reply automatically! 🚀

**Your Twitter Login for Dev Portal**:
- URL: https://developer.twitter.com/
- Email: `Amirworks69@gmail.com`
- Password: `VeriFiMirage@2025`

