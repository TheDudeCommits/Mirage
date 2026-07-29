import assert from "node:assert/strict";
import test from "node:test";
import { CID } from "multiformats/cid";
import { create as createDigest } from "multiformats/hashes/digest";
import {
  buildPinataGatewayUrl,
  buildPinataPinListUrl,
  normalizeIpfsCid,
  PINATA_API_ORIGIN,
  PINATA_GATEWAY_ORIGIN,
} from "./pinata-url.js";

const cid = CID.createV1(
  0x55,
  createDigest(0x12, new Uint8Array(32)),
).toString();

test("constructs fixed-origin Pinata URLs for a canonical CID", () => {
  const gatewayUrl = buildPinataGatewayUrl(cid);
  assert.equal(gatewayUrl.origin, PINATA_GATEWAY_ORIGIN);
  assert.equal(gatewayUrl.pathname, `/ipfs/${cid}`);
  assert.equal(gatewayUrl.search, "");

  const pinListUrl = buildPinataPinListUrl(cid);
  assert.equal(pinListUrl.origin, PINATA_API_ORIGIN);
  assert.equal(pinListUrl.pathname, "/data/pinList");
  assert.equal(pinListUrl.searchParams.get("hashContains"), cid);
});

test("rejects path, URL, credential, and encoded-origin bypass attempts", () => {
  const invalid = [
    `${cid}/../../admin`,
    `${cid}%2f..%2fadmin`,
    `https://127.0.0.1/${cid}`,
    `user:password@${cid}`,
    `${cid}?redirect=https://127.0.0.1`,
    `${cid}#fragment`,
    ` ${cid}`,
    `${cid} `,
    cid.toUpperCase(),
    "2130706433",
    "localhost",
  ];

  for (const value of invalid) {
    assert.throws(() => normalizeIpfsCid(value));
  }
});
