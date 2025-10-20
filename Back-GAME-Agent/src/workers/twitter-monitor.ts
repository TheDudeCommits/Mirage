import { GameWorker } from "@virtuals-protocol/game";
import type { TwitterClient } from "../twitter-client.js";
import type { VerificationState } from "../types.js";
import { createFetchMentionsFunction } from "../functions/fetch-mentions.js";

export function createTwitterMonitorWorker(
  twitterClient: TwitterClient,
  state: VerificationState
) {
  return new GameWorker({
    id: "twitter_monitor",
    name: "Twitter Mention Monitor",
    description: "Monitors Twitter for mentions where users tag the agent requesting content verification. Tracks which mentions have been processed and fetches new ones.",
    functions: [createFetchMentionsFunction(twitterClient)],
    getEnvironment: async () => {
      return {
        lastCheckedMentionId: state.lastCheckedMentionId || "none",
        processedCount: state.processedMentionIds.size,
        lastCheckTime: state.lastCheckTime.toISOString(),
        status: "active",
      };
    },
  });
}

