#!/bin/bash

echo "🧪 Quick Test Script"
echo "===================="
echo ""

# Check .env file
echo "1️⃣ Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    if grep -q "PINATA_JWT=eyJ" .env; then
        echo "   ✅ Pinata JWT configured"
    else
        echo "   ⚠️  Pinata JWT missing"
    fi
    if grep -q "TWITTER_BEARER_TOKEN=AAAA" .env; then
        echo "   ✅ Twitter credentials configured"
    else
        echo "   ⚠️  Twitter credentials missing"
    fi
else
    echo "   ❌ .env file not found!"
    exit 1
fi

echo ""
echo "2️⃣ Checking backend..."
if curl -s http://localhost:5001/ > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 5001"
else
    echo "   ⚠️  Backend not running. Start with:"
    echo "      cd ../Back-AI-Text-Detector"
    echo "      source venv/bin/activate"
    echo "      python3 run-on-port-5001.py"
fi

echo ""
echo "3️⃣ Checking agent..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Agent is running on port 3001"
    echo ""
    curl -s http://localhost:3001/agent/status | python3 -m json.tool 2>/dev/null || echo "   Status: Running"
else
    echo "   ⚠️  Agent not running. Start with:"
    echo "      npm run dev"
fi

echo ""
echo "===================="
echo "✅ Setup complete! See TEST_NOW.md for usage."
