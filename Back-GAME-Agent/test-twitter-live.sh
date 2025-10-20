#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "  🐦 Twitter Integration Test - Live Console"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Instructions:"
echo "   1. This will start the agent with verbose logging"
echo "   2. Tweet from ANY account: @MiraAIAgent verify this text"
echo "   3. Watch this console for real-time processing"
echo "   4. You'll see: mentions → analysis → IPFS → reply"
echo ""
echo "⏱️  Agent checks Twitter every 60 seconds"
echo "💡 Press Ctrl+C to stop"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
sleep 2

echo "🚀 Starting agent with live logging..."
echo ""

npm run dev

