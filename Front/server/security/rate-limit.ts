import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

interface SecurityRateLimitOptions {
  windowMs: number;
  limit: number;
}

export function createSecurityRateLimiter({
  windowMs,
  limit,
}: SecurityRateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    handler: (_request, response) => {
      response
        .status(429)
        .set("Cache-Control", "no-store")
        .json({ error: "Too many requests. Please try again later." });
    },
  });
}

export const oauthStartRateLimit = createSecurityRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

export const oauthCallbackRateLimit = createSecurityRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

export const authReadRateLimit = createSecurityRateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
});

export const authWriteRateLimit = createSecurityRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

export const pageRenderRateLimit = createSecurityRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
});
