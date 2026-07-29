import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

test("accepts only signed, expected Twitter authentication claims", async () => {
  process.env.NEXTAUTH_SECRET = randomBytes(32).toString("hex");
  process.env.TWITTER_CLIENT_ID = "test-client-id";
  process.env.TWITTER_CLIENT_SECRET = randomBytes(24).toString("hex");

  const { generateAuthToken, verifyAuthToken } = await import("../auth.js");
  const user = {
    id: "123",
    username: "tester",
    displayName: "Test User",
    provider: "twitter" as const,
  };

  const token = generateAuthToken(user);
  assert.deepEqual(verifyAuthToken(token), {
    ...user,
    profileImageUrl: undefined,
  });
  assert.equal(verifyAuthToken(""), null);
  assert.equal(verifyAuthToken(`${token}tampered`), null);
});
