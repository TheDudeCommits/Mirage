import { GameWorker } from "@virtuals-protocol/game";
import { analyzeContentFunction } from "../functions/analyze-content.js";
import type { VerificationState } from "../types.js";

export function createContentAnalyzerWorker(state: VerificationState) {
  return new GameWorker({
    id: "content_analyzer",
    name: "AI Content Analyzer",
    description: "Analyzes text content from tweets to determine if it's AI-generated or human-written. Uses the backend AI detection API to classify content and provide confidence scores.",
    functions: [analyzeContentFunction],
    getEnvironment: async () => {
      return {
        pendingAnalyses: state.pendingVerifications,
        totalAnalyzed: state.totalVerifications,
        backendStatus: "connected",
      };
    },
  });
}

