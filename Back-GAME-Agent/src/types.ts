// Types for the GAME agent

export interface TwitterMention {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
  inReplyToUserId?: string;
}

export interface AIDetectionResult {
  classification: string; // "Human-Written" | "AI-Generated" | "Not Found"
  probability?: number;
  label?: string;
  confidence?: number;
}

export interface VerificationState {
  lastCheckedMentionId: string | null;
  processedMentionIds: Set<string>;
  pendingVerifications: number;
  totalVerifications: number;
  lastCheckTime: Date;
}

export interface AgentEnvironment {
  recentMentions: TwitterMention[];
  pendingVerifications: number;
  lastCheckTime: string;
  agentStatus: string;
}

