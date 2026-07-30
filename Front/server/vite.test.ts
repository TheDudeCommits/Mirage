import assert from "node:assert/strict";
import test from "node:test";
import { log } from "./vite.js";

test("log neutralizes line breaks in untrusted fields", () => {
  const entries: string[] = [];
  const originalLog = console.log;
  console.log = (...values: unknown[]) => entries.push(values.join(" "));

  try {
    log("request complete\r\n[forged] success", "api\nforged-source");
  } finally {
    console.log = originalLog;
  }

  assert.equal(entries.length, 1);
  assert.doesNotMatch(entries[0], /[\r\n]/);
  assert.match(
    entries[0],
    /\[api forged-source\] request complete  \[forged\] success$/,
  );
});
