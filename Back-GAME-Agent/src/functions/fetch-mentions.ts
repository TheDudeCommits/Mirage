import {
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { TwitterClient } from "../twitter-client.js";

export function createFetchMentionsFunction(twitterClient: TwitterClient) {
  return new GameFunction({
    name: "fetch_twitter_mentions",
    description: "Fetch recent Twitter mentions where users are requesting content verification. Returns list of tweets mentioning the agent that need to be analyzed.",
    args: [
      {
        name: "since_id",
        type: "string",
        description: "Optional tweet ID to fetch mentions since (for pagination)",
        required: false,
      },
    ] as const,
    executable: async (args, logger) => {
      try {
        logger("📥 Fetching recent Twitter mentions...");
        
        const mentions = await twitterClient.fetchRecentMentions(args.since_id);
        
        if (mentions.length === 0) {
          logger("No new mentions found");
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "No new mentions to process"
          );
        }

        const mentionsSummary = mentions.map(m => ({
          id: m.id,
          from: `@${m.authorUsername}`,
          text: m.text.substring(0, 100),
        }));

        logger(`Found ${mentions.length} new mentions: ${JSON.stringify(mentionsSummary)}`);
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Successfully fetched ${mentions.length} mentions. Latest mention ID: ${mentions[0]?.id}`
        );
        
      } catch (error: any) {
        logger(`Failed to fetch mentions: ${error.message}`);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Error fetching mentions: ${error.message}`
        );
      }
    },
  });
}

