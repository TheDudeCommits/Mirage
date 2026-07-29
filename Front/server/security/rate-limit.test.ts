import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { createSecurityRateLimiter } from "./rate-limit.js";

test("fails closed with 429 after the configured request budget", async (context) => {
  const app = express();
  app.get(
    "/limited",
    createSecurityRateLimiter({ windowMs: 60_000, limit: 2 }),
    (_request, response) => response.status(200).json({ ok: true }),
  );

  const server = app.listen(0, "127.0.0.1");
  context.after(() => server.close());
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}/limited`;

  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url)).status, 200);

  const limited = await fetch(url);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("cache-control"), "no-store");
  assert.match(limited.headers.get("ratelimit") ?? "", /r=0/);
});
