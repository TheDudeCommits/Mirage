import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicIpAddress,
  prepareDetectorRequest,
  validateTextDetectorUrl,
} from "./outbound-url.js";

test("allows only the fixed local detector endpoint in development", () => {
  const url = validateTextDetectorUrl("http://localhost:5001/api/detect", {
    environment: "development",
  });
  assert.equal(url.origin, "http://localhost:5001");

  assert.throws(() =>
    validateTextDetectorUrl("http://localhost:5001/admin", {
      environment: "development",
    })
  );
  assert.throws(() =>
    validateTextDetectorUrl("http://127.0.0.1:5001/api/detect", {
      environment: "production",
    })
  );
});

test("requires an exact allowlisted HTTPS origin for remote detectors", () => {
  const url = validateTextDetectorUrl("https://detector.example.com/api/detect", {
    environment: "production",
    allowedOrigins: ["https://detector.example.com"],
  });
  assert.equal(url.toString(), "https://detector.example.com/api/detect");
  assert.throws(() =>
    validateTextDetectorUrl("https://detector.example.com/api/detect", {
      environment: "production",
      allowedOrigins: ["https://*.example.com"],
    })
  );

  const invalid = [
    "http://detector.example.com/api/detect",
    "https://user:password@detector.example.com/api/detect",
    "https://detector.example.com.evil.test/api/detect",
    "https://detector.example.com/api/detect?url=http://127.0.0.1",
    "https://detector.example.com/%61pi/detect",
    "https://detector.example.com\\@127.0.0.1/api/detect",
    "https://2130706433/api/detect",
    "https://127.1/api/detect",
    "https://[::1]/api/detect",
    " https://detector.example.com/api/detect",
  ];

  for (const value of invalid) {
    assert.throws(() =>
      validateTextDetectorUrl(value, {
        environment: "production",
        allowedOrigins: ["https://detector.example.com"],
      })
    );
  }
});

test("classifies private, loopback, link-local, mapped, and reserved addresses", () => {
  for (const address of [
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "198.51.100.1",
    "203.0.113.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2002:7f00:1::",
    "3fff::1",
  ]) {
    assert.equal(isPublicIpAddress(address), false, address);
  }

  assert.equal(isPublicIpAddress("8.8.8.8"), true);
  assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
});

test("pins a public DNS result and rejects mixed or private DNS answers", async () => {
  const target = validateTextDetectorUrl("https://detector.example.com/api/detect", {
    environment: "production",
    allowedOrigins: ["https://detector.example.com"],
  });

  const prepared = await prepareDetectorRequest(target, async () => [
    { address: "8.8.8.8", family: 4 },
  ]);
  assert.equal(prepared.requestUrl, "https://8.8.8.8/api/detect");
  assert.equal(prepared.hostHeader, "detector.example.com");
  assert.ok(prepared.httpsAgent);

  await assert.rejects(() =>
    prepareDetectorRequest(target, async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ])
  );
  await assert.rejects(() =>
    prepareDetectorRequest(target, async () => [
      { address: "169.254.169.254", family: 4 },
    ])
  );
});
