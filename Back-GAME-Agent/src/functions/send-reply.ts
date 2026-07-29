import {
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { TwitterClient } from "../twitter-client.js";
import { createVerificationMetadata, uploadVerificationToIPFS } from "../ipfs-tracker.js";
import { verifyReplyInput } from "../security/reply-input.js";

export function createSendReplyFunction(twitterClient: TwitterClient) {
  return new GameFunction({
    name: "send_verification_reply",
    description: "Send a reply to a tweet with the AI detection verification results. This informs the user whether their content is human-written or AI-generated.",
    args: [
      {
        name: "tweet_id",
        type: "string",
        description: "The ID of the tweet to reply to",
        required: true,
      },
      {
        name: "classification",
        type: "string",
        description: "The classification result: 'Human-Written' or 'AI-Generated'",
        required: true,
      },
      {
        name: "confidence",
        type: "number",
        description: "Confidence score (0-100)",
        required: true,
      },
      {
        name: "author_username",
        type: "string",
        description: "Username of the person who requested verification",
        required: true,
      },
      {
        name: "text",
        type: "string",
        description: "The original text that was analyzed",
        required: false,
      },
    ] as const,
    executable: async (args, logger) => {
      try {
        const input = verifyReplyInput(args);
        logger(`📤 Preparing reply for @${input.authorUsername}...`);
        
        // Upload verification to IPFS first
        const metadata = createVerificationMetadata(
          input.tweetId,
          input.text,
          input.authorUsername,
          input.classification,
          input.confidence
        );
        
        const ipfsCid = await uploadVerificationToIPFS(metadata);
        
        // Format the reply message
        const emoji = input.classification === "Human-Written" ? "✅" : "🤖";
        let message = 
          `${emoji} Verification Result for @${input.authorUsername}\n\n` +
          `Classification: ${input.classification}\n` +
          `Confidence: ${input.confidence}%\n\n` +
          `This content appears to be ${input.classification.toLowerCase()}.`;
        
        // Add IPFS link if available
        if (ipfsCid) {
          message += `\n\n🔗 Verification stored on IPFS: https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
          logger(`📌 IPFS CID: ${ipfsCid}`);
        }

        logger(`Reply message: ${message}`);
        
        // Send the reply
        const success = await twitterClient.replyToTweet(input.tweetId, message);
        
        if (success) {
          logger(`✅ Successfully replied to tweet ${input.tweetId}`);
          const result = `Replied to @${input.authorUsername} with verification results`;
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            ipfsCid ? `${result}. IPFS: ${ipfsCid}` : result
          );
        } else {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to send reply to tweet ${input.tweetId}`
          );
        }
        
      } catch (error: any) {
        logger(`❌ Failed to send reply: ${error.message}`);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Error sending reply: ${error.message}`
        );
      }
    },
  });
}
