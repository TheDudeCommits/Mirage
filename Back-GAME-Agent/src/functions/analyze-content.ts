import {
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import axios from "axios";
import { config } from "../config.js";
import {
  prepareDetectorRequest,
  validateTextDetectorUrl,
} from "../security/outbound-url.js";

export const analyzeContentFunction = new GameFunction({
  name: "analyze_text_authenticity",
  description: "Analyze text content to determine if it's AI-generated or human-written. Sends the text to the AI detection backend API and returns the classification result.",
  args: [
    {
      name: "text",
      type: "string",
      description: "The text content to analyze for AI detection",
      required: true,
    },
    {
      name: "tweet_id",
      type: "string",
      description: "The tweet ID this content came from",
      required: true,
    },
  ] as const,
  executable: async (args, logger) => {
    try {
      if (!args.text || args.text.trim().length === 0) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "No text content provided to analyze"
        );
      }

      logger(`🔍 Analyzing content from tweet ${args.tweet_id}...`);
      logger(`Text: "${args.text.substring(0, 100)}..."`);
      
      // Call the text detection backend API
      const detectorUrl = validateTextDetectorUrl(
        config.backends.textDetectorUrl,
        {
          environment: process.env.NODE_ENV,
          allowedOrigins: config.backends.textDetectorAllowedOrigins,
        },
      );
      const preparedRequest = await prepareDetectorRequest(detectorUrl);
      const response = await axios.post(
        preparedRequest.requestUrl,
        { text: args.text },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(preparedRequest.hostHeader
              ? { Host: preparedRequest.hostHeader }
              : {}),
          },
          httpsAgent: preparedRequest.httpsAgent,
          proxy: false,
          maxRedirects: 0,
          maxContentLength: 1024 * 1024,
          maxBodyLength: 256 * 1024,
          timeout: 30000, // 30 second timeout
        }
      );

      const result = response.data;
      
      // Parse the response from backend
      // Backend returns: { probability: number, label: "AI-Generated" | "Human-Written" }
      const classification = result.label || "Unknown";
      const confidence = result.probability || 0;

      logger(`✅ Analysis complete: ${classification} (${confidence}% confidence)`);
      
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Analysis complete for tweet ${args.tweet_id}: ${classification} with ${confidence}% confidence.`
      );
      
    } catch (error: any) {
      logger(`❌ Analysis failed: ${error.message}`);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Failed to analyze content: ${error.message}`
      );
    }
  },
});
