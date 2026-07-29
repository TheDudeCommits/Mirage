# 🐦 Twitter API Setup - Fix 403 Error

## ✅ Package Fixed!

The GAME SDK is now working! The current issue is Twitter API authentication.

---

## 🔴 Current Error

```
❌ Request failed with code 403
```

This means Twitter is rejecting your Bearer Token.

---

## 🔧 How to Fix

### Step 1: Check Twitter App Settings

Go to: https://developer.twitter.com/en/portal/dashboard

1. **Login** with: `<provider-account-email>` / `VeriFiMirage@2025`

2. **Find your app** (or create a new one)

3. **Check App Permissions**:
   - Must have **Read** permission (for fetching mentions)
   - Should also have **Write** permission (for posting replies)

4. **Regenerate Bearer Token**:
   - Go to "Keys and tokens" tab
   - Click "Regenerate" on Bearer Token
   - Copy the NEW token immediately

### Step 2: Update .env File

```bash
cd /Users/vladyslavaka/Downloads/twitter/Back-GAME-Agent
nano .env
```

Replace the Bearer Token line:
```env
# OLD (has %2F encoding issue):
TWITTER_BEARER_TOKEN=<set-in-local-env>

# NEW (paste fresh token):
TWITTER_BEARER_TOKEN=<set-in-local-env>
```

**Important**: Make sure there are NO spaces or URL encoding in the token!

### Step 3: Verify Other Credentials

While you're at it, verify all Twitter credentials are correct:

```env
TWITTER_API_KEY=<set-in-local-env>
TWITTER_API_SECRET=<set-in-local-env>
TWITTER_ACCESS_TOKEN=<set-in-local-env>
TWITTER_ACCESS_SECRET=<set-in-local-env>
TWITTER_BEARER_TOKEN=<set-in-local-env>
```

### Step 4: Get User ID

The agent needs your Twitter user ID. Get it from:

**Option A: Twitter API**
```bash
Authorization-header-provided-at-runtime
# Authorization is supplied at runtime from TWITTER_BEARER_TOKEN.
```

**Option B: Online Tool**
- Go to: https://tweeterid.com/
- Enter your handle: @MiraAIAgent
- Copy the numeric ID

Then update `.env`:
```env
TWITTER_USER_ID=<set-in-local-env>
```

### Step 5: Test the Fix

```bash
npm run dev
```

**Expected output:**
```
✅ Twitter client initialized for @MiraAIAgent (ID: 1945577578745470976)
🎯 Starting autonomous agent...
serving on localhost:3001
```

---

## 🧪 Test Twitter API Manually

Before running the agent, test your credentials:

```bash
# Test Bearer Token
Authorization-header-provided-at-runtime
# Authorization is supplied at runtime from TWITTER_BEARER_TOKEN.

# Should return:
{
  "data": {
    "id": "1945577578745470976",
    "name": "Mira",
    "username": "MiraAIAgent"
  }
}
```

If this works, the agent will work!

---

## 🔍 Common Issues

### Issue: "Forbidden - Authentication failed"

**Cause**: Invalid or expired Bearer Token

**Fix**: 
1. Go to Twitter Dev Portal
2. Regenerate Bearer Token
3. Update `.env` immediately
4. Restart agent

### Issue: "App does not have required permissions"

**Cause**: App permissions not set correctly

**Fix**:
1. Go to App Settings → Permissions
2. Change to "Read and Write"
3. Save changes
4. Regenerate Access Token & Secret (required after permission change)
5. Update `.env`

### Issue: "Could not authenticate you"

**Cause**: Tokens don't match the app

**Fix**:
1. Make sure all tokens are from the SAME app
2. Check no extra spaces in `.env`
3. Verify tokens weren't regenerated elsewhere

### Issue: URL encoding in Bearer Token

**Cause**: Token has `%2F` or other encoded characters

**Fix**:
1. Copy token exactly as shown (without any modifications)
2. Don't paste into URL encoders
3. If it has encoding, regenerate a fresh one

---

## ✅ What Should Work After Fix

Once Twitter credentials are correct:

1. **Agent starts** ✅
2. **Connects to Twitter** ✅
3. **Fetches mentions** every 60 seconds
4. **Analyzes text** from tweets
5. **Uploads to IPFS** ✅ (Pinata JWT is configured)
6. **Replies on Twitter** with results

---

## 📝 Quick Checklist

Before starting the agent:

- [ ] Bearer Token is fresh (not URL encoded)
- [ ] App has "Read and Write" permissions
- [ ] All tokens are from the same app
- [ ] User ID is correct in `.env`
- [ ] No spaces or line breaks in tokens
- [ ] Backend is running on port 5001
- [ ] Pinata JWT is set (for IPFS)

---

## 🆘 Still Having Issues?

### Debug Mode

Add this to see detailed Twitter API responses:

```typescript
// In src/twitter-client.ts, add:
console.log('Twitter API Request:', {
  bearerTokenConfigured: Boolean(process.env.TWITTER_BEARER_TOKEN),
  endpoint: 'v2/users/me'
});
```

### Test Minimal Script

Create `test-twitter.js`:
```javascript
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

client.v2.me()
  .then(user => console.log('✅ Success:', user.data))
  .catch(err => console.error('❌ Error:', err));
```

Run: `node test-twitter.js`

---

## 🎉 Once Fixed

You'll see:
```
✅ Configuration validated successfully
✅ Twitter client initialized for @MiraAIAgent
🎯 Starting autonomous agent...
📥 Fetched X new mentions
🔍 Analyzing content...
✅ Analysis complete: Human-Written (85%)
📌 Uploaded to IPFS: QmX...
📤 Successfully replied!
```

Then tweet at `@MiraAIAgent` and watch it work! 🚀

---

**The GAME SDK package is FIXED! Just need to sort out Twitter credentials.** ✅
