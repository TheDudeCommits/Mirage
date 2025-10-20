import type { VerificationState, TwitterMention } from "./types.js";

/**
 * Global agent state management
 */
export class AgentState {
  private state: VerificationState;
  private mentions: TwitterMention[] = [];

  constructor() {
    this.state = {
      lastCheckedMentionId: null,
      processedMentionIds: new Set<string>(),
      pendingVerifications: 0,
      totalVerifications: 0,
      lastCheckTime: new Date(),
    };
  }

  /**
   * Get current state for agent awareness
   */
  async getAgentState(): Promise<Record<string, any>> {
    return {
      lastCheckedMentionId: this.state.lastCheckedMentionId || "none",
      processedMentionsCount: this.state.processedMentionIds.size,
      pendingVerifications: this.state.pendingVerifications,
      totalVerifications: this.state.totalVerifications,
      lastCheckTime: this.state.lastCheckTime.toISOString(),
      recentMentions: this.mentions.slice(0, 5).map(m => ({
        id: m.id,
        from: `@${m.authorUsername}`,
        text: m.text.substring(0, 100),
      })),
      agentStatus: "active",
    };
  }

  /**
   * Update mentions from Twitter
   */
  updateMentions(newMentions: TwitterMention[]) {
    if (newMentions.length > 0) {
      this.mentions = [...newMentions, ...this.mentions].slice(0, 20); // Keep last 20
      this.state.lastCheckedMentionId = newMentions[0].id;
      this.state.pendingVerifications = newMentions.length;
    }
    this.state.lastCheckTime = new Date();
  }

  /**
   * Mark a mention as processed
   */
  markProcessed(mentionId: string) {
    this.state.processedMentionIds.add(mentionId);
    this.state.totalVerifications++;
    this.state.pendingVerifications = Math.max(0, this.state.pendingVerifications - 1);
  }

  /**
   * Get raw state for workers
   */
  getState(): VerificationState {
    return this.state;
  }

  /**
   * Get unprocessed mentions
   */
  getUnprocessedMentions(): TwitterMention[] {
    return this.mentions.filter(m => !this.state.processedMentionIds.has(m.id));
  }
}

