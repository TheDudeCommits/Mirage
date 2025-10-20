import express from 'express';
import { ContentVerificationAgent } from './agent.js';
import { config, validateConfig } from './config.js';

const app = express();
app.use(express.json());

// Global agent instance
let agent: ContentVerificationAgent | null = null;

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: agent ? agent.getStatus() : { isRunning: false },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start the agent
 */
app.post('/agent/start', async (req, res) => {
  try {
    if (agent && agent.getStatus().isRunning) {
      return res.status(400).json({ error: 'Agent is already running' });
    }

    console.log('🚀 Starting agent via API...');
    agent = new ContentVerificationAgent();
    await agent.initialize();
    
    // Start in background (don't await)
    agent.start().catch(error => {
      console.error('❌ Agent error:', error);
    });

    res.json({
      success: true,
      message: 'Agent started successfully',
      status: agent.getStatus(),
    });
  } catch (error: any) {
    console.error('Failed to start agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop the agent
 */
app.post('/agent/stop', async (req, res) => {
  try {
    if (!agent) {
      return res.status(400).json({ error: 'Agent is not running' });
    }

    await agent.stop();
    res.json({
      success: true,
      message: 'Agent stopped successfully',
    });
  } catch (error: any) {
    console.error('Failed to stop agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get agent status
 */
app.get('/agent/status', (req, res) => {
  res.json({
    agent: agent ? agent.getStatus() : { isRunning: false },
    config: {
      checkIntervalSeconds: config.checkIntervalSeconds,
      maxTweetsPerCheck: config.maxTweetsPerCheck,
      agentHandle: config.twitter.agentHandle,
    },
  });
});

/**
 * Manual step (for testing)
 */
app.post('/agent/step', async (req, res) => {
  try {
    if (!agent) {
      agent = new ContentVerificationAgent();
      await agent.initialize();
    }

    await agent.step();
    
    res.json({
      success: true,
      message: 'Agent step executed',
      status: agent.getStatus(),
    });
  } catch (error: any) {
    console.error('Failed to execute step:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Main function
 */
async function main() {
  try {
    // Validate configuration
    validateConfig();

    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🤖 GAME Agent - Twitter Content Verifier                ║
║                                                            ║
║   Server running on http://localhost:${PORT}                ║
║                                                            ║
║   API Endpoints:                                           ║
║   - GET  /health          Health check                    ║
║   - POST /agent/start     Start autonomous agent          ║
║   - POST /agent/stop      Stop agent                      ║
║   - GET  /agent/status    Get agent status                ║
║   - POST /agent/step      Execute single step (testing)   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);

      // Auto-start agent if configured
      if (process.env.AUTO_START === 'true') {
        console.log('🚀 Auto-starting agent...');
        agent = new ContentVerificationAgent();
        agent.initialize()
          .then(() => agent!.start())
          .catch(error => {
            console.error('❌ Failed to auto-start agent:', error);
          });
      } else {
        console.log('💡 Tip: Call POST /agent/start to begin monitoring Twitter');
      }
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (agent) {
    await agent.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (agent) {
    await agent.stop();
  }
  process.exit(0);
});

// Start the server
main();

