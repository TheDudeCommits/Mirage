#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🤖 GAME Agent - Twitter Content Verifier                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo ""
    echo "Please create a .env file with your configuration."
    echo "See SETUP.md or INTEGRATION_COMPLETE.md for instructions."
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Starting GAME Agent...${NC}"
echo ""
echo "The agent will:"
echo "  1. Monitor Twitter for mentions"
echo "  2. Analyze content with AI detection"
echo "  3. Reply with verification results"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev

