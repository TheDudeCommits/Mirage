import { GameWorker } from "@virtuals-protocol/game";
import type { TwitterClient } from "../twitter-client.js";
import type { VerificationState } from "../types.js";
import { createSendReplyFunction } from "../functions/send-reply.js";

export function createResponseHandlerWorker(
  twitterClient: TwitterClient,
  state: VerificationState
) {
  return new GameWorker({
    id: "response_handler",
    name: "Verification Response Handler",
    description: "Sends verification results back to users on Twitter. Composes clear, informative replies with the AI detection classification and confidence scores.",
    functions: [createSendReplyFunction(twitterClient)],
    getEnvironment: async () => {
      return {
        totalRepliesSent: state.totalVerifications,
        pendingReplies: state.pendingVerifications,
        status: "ready",
      };
    },
  });
}

