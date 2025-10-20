import { GameAgent } from "@virtuals-protocol/game";
import { TwitterClient } from "./twitter-client.js";
import { AgentState } from "./state.js";
import { createTwitterMonitorWorker } from "./workers/twitter-monitor.js";
import { createContentAnalyzerWorker } from "./workers/content-analyzer.js";
import { createResponseHandlerWorker } from "./workers/response-handler.js";
import { config } from "./config.js";

/**
 * Main GAME Agent for autonomous Twitter content verification
 */
export class ContentVerificationAgent {
  private agent: GameAgent | null = null;
  private twitterClient: TwitterClient;
  private agentState: AgentState;
  private isRunning: boolean = false;

  constructor() {
    this.twitterClient = new TwitterClient();
    this.agentState = new AgentState();
  }

  /**
   * Initialize the agent and all its components
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Content Verification Agent...');
    
    // Initialize Twitter client
    await this.twitterClient.initialize();
    
    // Create workers with shared state
    const state = this.agentState.getState();
    const twitterMonitor = createTwitterMonitorWorker(this.twitterClient, state);
    const contentAnalyzer = createContentAnalyzerWorker(state);
    const responseHandler = createResponseHandlerWorker(this.twitterClient, state);
    
    // Create the GAME agent
    this.agent = new GameAgent(config.gameApiKey, {
      name: "AskMira Content Verifier",
      goal: "Autonomously monitor Twitter for content verification requests. When users mention the agent, extract their content, analyze it using AI detection, and reply with clear verification results indicating if content is human-written or AI-generated.",
      description: `You are AskMira, an autonomous AI content verification agent on Twitter. Your role is to:

1. MONITOR: Continuously check for Twitter mentions where users request content verification
2. ANALYZE: Extract text from mentioned tweets and send it to AI detection APIs
3. VERIFY: Determine if content is human-written or AI-generated with confidence scores
4. RESPOND: Reply to users with clear, helpful verification results

Your personality is professional, helpful, and transparent. You provide clear explanations of AI detection results and help users understand content authenticity.

Key behaviors:
- Check for new mentions regularly (every ${config.checkIntervalSeconds} seconds)
- Process each mention only once (track processed IDs)
- Always reply with verification results
- Handle errors gracefully and inform users if analysis fails
- Be concise and clear in your responses

You have three specialized workers:
- Twitter Monitor: Fetches new mentions
- Content Analyzer: Calls AI detection backend
- Response Handler: Sends verification results back to users`,
      getAgentState: () => this.agentState.getAgentState(),
      workers: [twitterMonitor, contentAnalyzer, responseHandler],
    });

    console.log('✅ Agent initialized successfully');
  }

  /**
   * Start the autonomous agent loop
   */
  async start(): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    if (this.isRunning) {
      console.log('⚠️ Agent is already running');
      return;
    }

    console.log(`🎯 Starting autonomous agent (checking every ${config.checkIntervalSeconds}s)...`);
    this.isRunning = true;

    // Initialize the agent
    await this.agent.init();

    // Start the autonomous loop
    await this.agent.run(config.checkIntervalSeconds, {
      verbose: true,
    });
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping agent...');
    this.isRunning = false;
    // Note: GAME SDK doesn't have a built-in stop method
    // In production, you'd implement graceful shutdown here
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      state: this.agentState.getState(),
    };
  }

  /**
   * Process a single step (for testing)
   */
  async step(): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }
    await this.agent.step();
  }
}

