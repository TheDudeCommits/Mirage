export type VerificationClassification = "Human-Written" | "AI-Generated";

interface ReplyInputSource {
  tweet_id?: unknown;
  classification?: unknown;
  confidence?: unknown;
  author_username?: unknown;
  text?: unknown;
}

export interface VerifiedReplyInput {
  tweetId: string;
  classification: VerificationClassification;
  confidence: number;
  authorUsername: string;
  text: string;
}

export function verifyReplyInput(args: ReplyInputSource): VerifiedReplyInput {
  if (
    typeof args.tweet_id !== "string" ||
    !/^\d{1,32}$/.test(args.tweet_id)
  ) {
    throw new Error("A valid tweet ID is required");
  }
  if (
    args.classification !== "Human-Written" &&
    args.classification !== "AI-Generated"
  ) {
    throw new Error("A supported classification is required");
  }
  if (
    typeof args.confidence !== "number" ||
    !Number.isFinite(args.confidence) ||
    args.confidence < 0 ||
    args.confidence > 100
  ) {
    throw new Error("Confidence must be a number between 0 and 100");
  }
  if (
    typeof args.author_username !== "string" ||
    !/^[A-Za-z0-9_]{1,32}$/.test(args.author_username)
  ) {
    throw new Error("A valid author username is required");
  }
  if (
    args.text !== undefined &&
    (typeof args.text !== "string" || args.text.length > 10_000)
  ) {
    throw new Error("Reply text must be a string of at most 10000 characters");
  }

  return {
    tweetId: args.tweet_id,
    classification: args.classification,
    confidence: args.confidence,
    authorUsername: args.author_username,
    text: args.text ?? "",
  };
}
