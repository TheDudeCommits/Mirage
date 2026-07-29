import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // GAME API
  gameApiKey: process.env.GAME_API_KEY || '',
  
  // Twitter API
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    agentHandle: process.env.AGENT_TWITTER_HANDLE || 'YourAgentHandle',
  },
  
  // Backend APIs
  backends: {
    textDetectorUrl: process.env.TEXT_DETECTOR_API_URL || 'http://localhost:5001/api/detect',
    textDetectorAllowedOrigins: process.env.TEXT_DETECTOR_ALLOWED_ORIGINS || '',
    imageDetectorUrl: process.env.IMAGE_DETECTOR_API_URL || 'http://localhost:5002/detect',
  },
  
  // OpenAI (optional)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  // Agent Configuration
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS || '60', 10),
  maxTweetsPerCheck: parseInt(process.env.MAX_TWEETS_PER_CHECK || '10', 10),
};

// Validate required config
export function validateConfig() {
  const required = [
    { key: 'GAME_API_KEY', value: config.gameApiKey },
    { key: 'TWITTER_BEARER_TOKEN', value: config.twitter.bearerToken },
  ];

  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(m => m.key).join(', ')}\n` +
      'Please set them in your .env file'
    );
  }

  console.log('✅ Configuration validated successfully');
}
