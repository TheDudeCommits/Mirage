# 🧪 Test Your Agent NOW

## ✅ Everything is Ready!

Your `.env` file is complete with:
- ✅ Twitter credentials
- ✅ Pinata JWT (IPFS enabled!)
- ✅ Backend URL configured

---

## 🚀 Start Testing (2 Terminals)

### Terminal 1: Start Backend

```bash
cd /Users/vladyslavaka/Downloads/twitter/Back-AI-Text-Detector
source venv/bin/activate
python3 run-on-port-5001.py
```

**Wait for:**
```
🚀 Starting AI Text Detector on port 5001...
🔗 API endpoint: http://localhost:5001/api/detect
 * Running on http://127.0.0.1:5001
```

### Terminal 2: Start Agent

```bash
cd /Users/vladyslavaka/Downloads/twitter/Back-GAME-Agent
npm run dev
```

**Wait for:**
```
✅ Configuration validated successfully
✅ Twitter client initialized for @MiraAIAgent
🎯 Starting autonomous agent...
serving on localhost:3001
```

---

## 🧪 Test 1: Check Services

**Test Backend:**
```bash
curl -X POST http://localhost:5001/api/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog."}'
```

**Expected:** JSON with `probability` and `label`

**Test Agent:**
```bash
curl http://localhost:3001/health
```

**Expected:** `{"status": "ok", "agent": {...}}`

---

## 🐦 Test 2: Tweet at Your Agent

**From ANY Twitter account, tweet:**

```
@MiraAIAgent can you verify this text?
"The quick brown fox jumps over the lazy dog."
```

**What happens:**

1. **Wait 60 seconds** (agent checks every minute)

2. **Watch Terminal 2 logs:**
```
📥 Fetched 1 new mentions
🔍 Analyzing content from tweet 1945...
✅ Analysis complete: Human-Written (85% confidence)
📌 Uploaded to IPFS: QmX...abc123
🔗 View at: https://gateway.pinata.cloud/ipfs/QmX...
📤 Preparing reply for @yourusername...
✅ Successfully replied to tweet 1945...
```

3. **Check Twitter - Agent replies:**
```
✅ Verification Result for @yourusername

Classification: Human-Written
Confidence: 85%

This content appears to be human-written.

🔗 Verification stored on IPFS: https://gateway.pinata.cloud/ipfs/QmX...
```

4. **Click IPFS link** - See full verification data!

---

## 🎯 Test 3: Try AI-Generated Text

**Tweet:**
```
@MiraAIAgent verify this:
"In the realm of artificial intelligence, machine learning algorithms continuously evolve to optimize predictive analytics and enhance decision-making capabilities through iterative neural network training processes."
```

**Expected reply:**
```
🤖 Verification Result

Classification: AI-Generated
Confidence: 92%

This content appears to be ai-generated.

🔗 Verification stored on IPFS: ...
```

---

## 📊 Monitor Activity

### Watch Logs in Real-Time

**Terminal 2** shows everything:
- New mentions detected
- Content being analyzed
- IPFS uploads
- Twitter replies sent

### Check Pinata Dashboard

1. Go to https://app.pinata.cloud/
2. Login (<provider-account-email>)
3. View "Files" - See all verifications!

### Query Agent Status

```bash
# Get detailed status
curl http://localhost:3001/agent/status

# Manual step (for testing)
curl -X POST http://localhost:3001/agent/step
```

---

## 🐛 Troubleshooting

### Backend not responding

**Error:** `ECONNREFUSED`

```bash
# Check if backend is running
lsof -i:5001

# If not running, start it:
cd Back-AI-Text-Detector
source venv/bin/activate
python3 run-on-port-5001.py
```

### Agent not detecting mentions

**Problem:** No logs after 60 seconds

1. Check your Twitter handle in `.env`:
   ```
   AGENT_TWITTER_HANDLE=<set-in-local-env>
   ```
   Update if different!

2. Verify the tweet mentions exact handle
3. Wait full 60 seconds
4. Check Twitter API rate limits

### No IPFS links in replies

**Problem:** Reply works but no IPFS link

✅ Pinata JWT is now in `.env` - should work!

Check logs for:
```
📌 Uploaded to IPFS: QmX...
```

If missing:
```bash
# Test Pinata directly
curl -X POST https://api.pinata.cloud/data/testAuthentication \
# Authorization is supplied at runtime from TWITTER_BEARER_TOKEN.
```

---

## ✅ Success Checklist

Before going live:

- ✅ `.env` file exists in `/Back-GAME-Agent/`
- ✅ Pinata JWT configured (IPFS enabled!)
- ✅ Backend running on port 5001
- ✅ Agent running on port 3001
- ✅ Test tweet sent
- ✅ Agent detected mention (check logs)
- ✅ Agent replied on Twitter
- ✅ IPFS link included in reply
- ✅ IPFS link works (click to verify)

---

## 🎉 You're Live!

Once both services are running and you've tested successfully:

**Your agent is now:**
- ✅ Monitoring Twitter 24/7
- ✅ Analyzing content automatically
- ✅ Storing verifications on IPFS
- ✅ Replying with results + proof links

**No manual intervention needed!**

---

## 📝 Quick Commands Reference

```bash
# Start backend
cd Back-AI-Text-Detector && source venv/bin/activate && python3 run-on-port-5001.py

# Start agent  
cd Back-GAME-Agent && npm run dev

# Test backend
curl -X POST http://localhost:5001/api/detect -H "Content-Type: application/json" -d '{"text": "test"}'

# Test agent
curl http://localhost:3001/health

# Check status
curl http://localhost:3001/agent/status

# View .env
cat Back-GAME-Agent/.env
```

---

## 🎯 Next Steps

### After Testing Successfully

1. **Deploy to production** (use Docker)
2. **Monitor regularly** (check Pinata storage)
3. **Adjust settings** (interval, max tweets)
4. **Add analytics** (track verification trends)

### Optional Enhancements

- Image analysis support
- Thread conversation handling
- User rate limiting
- Webhook notifications
- Analytics dashboard

---

## 🆘 Need Help?

Check documentation:
- `/Back-GAME-Agent/START_HERE.md`
- `/SETUP_COMPLETE.md`
- `/Back-GAME-Agent/IPFS_INTEGRATION.md`

Or check logs for specific errors!

---

**Ready? Start both services and tweet at your agent!** 🚀

