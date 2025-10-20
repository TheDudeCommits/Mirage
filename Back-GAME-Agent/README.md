# 🤖 AskMira GAME Twitter Agent

An autonomous AI agent that monitors Twitter for content verification requests and automatically analyzes text to determine if it's human-written or AI-generated.

## 🎯 What It Does

The agent runs 24/7 and:
1. **Monitors** Twitter for mentions (@MiraAIAgent)
2. **Extracts** text content from tweets
3. **Analyzes** using AI detection backend
4. **Stores** verification results on IPFS (Pinata)
5. **Replies** with classification and confidence score

## 🏗️ Architecture

Built with the **GAME Framework** (Goal-Agent-Model-Environment):

- **Agent**: High-level autonomous orchestrator
- **3 Workers**: 
  - TwitterMonitor (fetches mentions)
  - ContentAnalyzer (AI detection)
  - ResponseHandler (posts replies)
- **3 Functions**: fetch_mentions, analyze_text, reply_with_result
- **State Management**: Tracks processed tweets, prevents duplicates

## 🔧 Tech Stack

- **GAME SDK** - Autonomous agent framework
- **Twitter API v2** - Real-time mention monitoring
- **Pinata/IPFS** - Decentralized verification storage
- **Express.js** - REST API server
- **TypeScript** - Type-safe development

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create `.env` file:

```env
# GAME API Key
GAME_API_KEY=your_game_api_key

# Twitter Credentials
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Your Agent's Twitter Handle
AGENT_TWITTER_HANDLE=YourAgentHandle

# Backend API
TEXT_DETECTOR_API_URL=http://localhost:5001/api/detect

# IPFS Storage (Optional)
PINATA_JWT=your_pinata_jwt

# Agent Settings
CHECK_INTERVAL_SECONDS=60
MAX_TWEETS_PER_CHECK=10
AUTO_START=true
PORT=3001
```

## 🚀 Usage

### Start the Agent

```bash
npm run dev
```

### Tweet at Your Agent

From any Twitter account:
```
@YourAgentHandle can you verify this text?
"The quick brown fox jumps over the lazy dog."
```

### Agent Response (after 60s)

```
✅ Verification Result for @username

Classification: Human-Written
Confidence: 85%

This content appears to be human-written.

🔗 Verification stored on IPFS: https://gateway.pinata.cloud/ipfs/Qm...
```

## 📊 Example Flow

```
User tweets → Agent detects (60s check cycle)
             ↓
          Extract text
             ↓
       AI Analysis (backend)
             ↓
       Upload to IPFS ⭐
             ↓
       Reply on Twitter ✅
```

## 🎯 Features

- ✅ **Autonomous Operation** - Runs 24/7 without manual intervention
- ✅ **Real-time Monitoring** - Checks Twitter every 60 seconds
- ✅ **AI Detection** - Classifies Human vs AI-generated content
- ✅ **IPFS Storage** - Permanent, immutable verification records
- ✅ **Auto-Reply** - Instant feedback to users
- ✅ **Duplicate Prevention** - Tracks processed mentions
- ✅ **Rate Limit Handling** - Graceful degradation

## 📁 Project Structure

```
src/
├── agent.ts              # Main GAME agent orchestrator
├── twitter-client.ts     # Twitter API integration
├── ipfs-tracker.ts       # IPFS/Pinata integration
├── config.ts             # Configuration management
├── state.ts              # State management
├── types.ts              # TypeScript definitions
├── functions/            # Executable actions
│   ├── fetch-mentions.ts
│   ├── analyze-content.ts
│   └── send-reply.ts
└── workers/              # Specialized workers
    ├── twitter-monitor.ts
    ├── content-analyzer.ts
    └── response-handler.ts
```

## 🔍 API Endpoints

Once running on `http://localhost:3001`:

```bash
# Health check
GET /health

# Agent status
GET /agent/status

# Start agent
POST /agent/start

# Stop agent
POST /agent/stop

# Manual step (testing)
POST /agent/step
```

## 🧪 Testing

```bash
# Check configuration
./quick-test.sh

# Start with live console output
./test-twitter-live.sh

# Test backend connection
curl -X POST http://localhost:5001/api/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "test message"}'

# Test agent health
curl http://localhost:3001/health
```

## 📚 Documentation

- `START_HERE.md` - Quick start guide
- `TEST_NOW.md` - Testing instructions
- `CONSOLE_OUTPUT_GUIDE.md` - Log interpretation
- `IPFS_INTEGRATION.md` - IPFS setup details

## 🐛 Troubleshooting

### Agent won't start
- Check `.env` file exists with all credentials
- Verify Twitter Bearer Token is valid
- Ensure backend is running on port 5001

### No mentions detected
- Verify `AGENT_TWITTER_HANDLE` matches your Twitter account
- Tag the exact handle in tweets
- Wait full 60 seconds between checks

### Backend connection failed
- Start backend: `cd ../Back-AI-Text-Detector && python3 run-on-port-5001.py`
- Check: `curl http://localhost:5001/`

## 📈 Monitoring

### Console Output
Watch for these indicators:
- `📥 Fetched X mentions` - Detection working
- `✅ Analysis complete` - Backend responding
- `📌 Uploaded to IPFS` - Storage working
- `📤 Successfully replied` - Reply sent

### Pinata Dashboard
View all stored verifications at https://app.pinata.cloud/

## 🔒 Security

- Twitter OAuth 1.0a authentication
- Environment variables for sensitive data
- Rate limiting protection
- Input validation on all endpoints

## 📊 What Gets Stored on IPFS

```json
{
  "tweetId": "123...",
  "tweetText": "Content analyzed...",
  "tweetAuthor": "username",
  "classification": "Human-Written",
  "confidence": 85,
  "timestamp": 1729425600000,
  "contentHash": "sha256...",
  "agentVersion": "1.0.0",
  "detectionModel": "desklib/ai-text-detector-v1.01"
}
```

## 🚀 Deployment

### Docker

```bash
docker-compose up -d
```

### Production

1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS
5. Monitor logs

## 🤝 Integration

### With Your Backend

Agent connects to AI detection API:
- Endpoint: `http://localhost:5001/api/detect`
- Method: POST
- Body: `{"text": "content to analyze"}`
- Response: `{"probability": 85, "label": "Human-Written"}`

### With Blockchain

Future: Store IPFS CIDs on-chain for additional verification layer.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [GAME SDK](https://github.com/game-by-virtuals/game-node)
- Powered by [Twitter API v2](https://developer.twitter.com/)
- Storage via [Pinata](https://pinata.cloud/)
- AI Detection by [Desklib](https://huggingface.co/desklib/ai-text-detector-v1.01)

## 📞 Support

- Check documentation in project root
- View logs for detailed error messages
- Test components individually (backend, Twitter API, IPFS)

---

**Status**: ⚠️ Package installation needs fixing
**Version**: 1.0.0
**Last Updated**: October 2025
