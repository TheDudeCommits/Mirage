import {
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { TwitterClient } from "../twitter-client.js";
import { createVerificationMetadata, uploadVerificationToIPFS } from "../ipfs-tracker.js";

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
        logger(`📤 Preparing reply for @${args.author_username}...`);
        
        // Upload verification to IPFS first
        const metadata = createVerificationMetadata(
          args.tweet_id,
          args.text || '',
          args.author_username,
          args.classification,
          args.confidence
        );
        
        const ipfsCid = await uploadVerificationToIPFS(metadata);
        
        // Format the reply message
        const emoji = args.classification === "Human-Written" ? "✅" : "🤖";
        let message = 
          `${emoji} Verification Result for @${args.author_username}\n\n` +
          `Classification: ${args.classification}\n` +
          `Confidence: ${args.confidence}%\n\n` +
          `This content appears to be ${args.classification.toLowerCase()}.`;
        
        // Add IPFS link if available
        if (ipfsCid) {
          message += `\n\n🔗 Verification stored on IPFS: https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
          logger(`📌 IPFS CID: ${ipfsCid}`);
        }

        logger(`Reply message: ${message}`);
        
        // Send the reply
        const success = await twitterClient.replyToTweet(args.tweet_id, message);
        
        if (success) {
          logger(`✅ Successfully replied to tweet ${args.tweet_id}`);
          const result = `Replied to @${args.author_username} with verification results`;
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            ipfsCid ? `${result}. IPFS: ${ipfsCid}` : result
          );
        } else {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to send reply to tweet ${args.tweet_id}`
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

