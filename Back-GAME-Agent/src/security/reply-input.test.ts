import assert from "node:assert/strict";
import test from "node:test";
import { verifyReplyInput } from "./reply-input.js";

test("accepts a complete bounded reply payload", () => {
  assert.deepEqual(
    verifyReplyInput({
      tweet_id: "123456789",
      classification: "Human-Written",
      confidence: 92,
      author_username: "TheDudeCommits",
      text: "Verified content",
    }),
    {
      tweetId: "123456789",
      classification: "Human-Written",
      confidence: 92,
      authorUsername: "TheDudeCommits",
      text: "Verified content",
    },
  );
});

test("rejects missing, malformed, and out-of-range reply fields", () => {
  const valid = {
    tweet_id: "123456789",
    classification: "AI-Generated",
    confidence: 50,
    author_username: "tester",
  };

  for (const value of [undefined, "", "123/path", "x".repeat(33)]) {
    assert.throws(() => verifyReplyInput({ ...valid, tweet_id: value }));
  }
  for (const value of [undefined, "Unknown", "human-written"]) {
    assert.throws(() => verifyReplyInput({ ...valid, classification: value }));
  }
  for (const value of [undefined, Number.NaN, -1, 101, "50"]) {
    assert.throws(() => verifyReplyInput({ ...valid, confidence: value }));
  }
  for (const value of [undefined, "@tester", "bad/name", "x".repeat(33)]) {
    assert.throws(() => verifyReplyInput({ ...valid, author_username: value }));
  }
  assert.throws(() => verifyReplyInput({ ...valid, text: "x".repeat(10_001) }));
});
