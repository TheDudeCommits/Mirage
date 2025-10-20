import { TwitterApi } from 'twitter-api-v2';
import { config } from './config.js';
import type { TwitterMention } from './types.js';

export class TwitterClient {
  private client: TwitterApi;
  private userId: string | null = null;

  constructor() {
    // Initialize Twitter client with OAuth 2.0 Bearer Token
    this.client = new TwitterApi(config.twitter.bearerToken);
  }

  /**
   * Initialize and authenticate the client
   */
  async initialize(): Promise<void> {
    try {
      // Get authenticated user info
      const user = await this.client.v2.me();
      this.userId = user.data.id;
      console.log(`✅ Twitter client initialized for @${user.data.username} (ID: ${this.userId})`);
    } catch (error) {
      console.error('❌ Failed to initialize Twitter client:', error);
      throw error;
    }
  }

  /**
   * Fetch recent mentions of the agent
   */
  async fetchRecentMentions(sinceId?: string): Promise<TwitterMention[]> {
    if (!this.userId) {
      throw new Error('Twitter client not initialized. Call initialize() first.');
    }

    try {
      const mentions = await this.client.v2.userMentionTimeline(this.userId, {
        max_results: config.maxTweetsPerCheck,
        since_id: sinceId,
        'tweet.fields': ['created_at', 'author_id', 'in_reply_to_user_id'],
        expansions: ['author_id'],
      });

      const results: TwitterMention[] = [];
      
      for (const tweet of mentions.data.data || []) {
        const author = mentions.includes?.users?.find(u => u.id === tweet.author_id);
        
        results.push({
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id || '',
          authorUsername: author?.username || 'unknown',
          createdAt: tweet.created_at || new Date().toISOString(),
          inReplyToUserId: tweet.in_reply_to_user_id,
        });
      }

      console.log(`📥 Fetched ${results.length} new mentions`);
      return results;
      
    } catch (error: any) {
      if (error.code === 429) {
        console.warn('⚠️ Rate limit reached. Waiting before next check...');
        return [];
      }
      console.error('❌ Error fetching mentions:', error);
      throw error;
    }
  }

  /**
   * Reply to a tweet with verification results
   */
  async replyToTweet(tweetId: string, message: string): Promise<boolean> {
    try {
      // For replying, we need OAuth 1.0a user context
      // Create client with user credentials
      const userClient = new TwitterApi({
        appKey: config.twitter.apiKey,
        appSecret: config.twitter.apiSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessSecret,
      });

      await userClient.v2.reply(message, tweetId);
      console.log(`✅ Replied to tweet ${tweetId}`);
      return true;
      
    } catch (error: any) {
      console.error(`❌ Failed to reply to tweet ${tweetId}:`, error);
      return false;
    }
  }

  /**
   * Extract text content from a mention (removing the @mentions)
   */
  extractContentFromMention(mention: TwitterMention): string {
    // Remove @mentions from the beginning of the text
    const text = mention.text
      .replace(/@\w+\s*/g, '')
      .trim();
    
    return text;
  }
}

