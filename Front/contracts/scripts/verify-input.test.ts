import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  explorerAddressUrl,
  normalizeContractAddress,
  normalizeNetworkName,
  readLatestDeployment,
} from "./verify-input.js";

const require = createRequire(import.meta.url);
const fs = require("node:fs") as typeof import("node:fs");
const address = "0x0000000000000000000000000000000000000001";

test("accepts only normalized Ethereum addresses and supported networks", () => {
  assert.equal(normalizeContractAddress(address), address);
  assert.equal(normalizeNetworkName("base"), "base");
  assert.equal(normalizeNetworkName("baseSepolia"), "baseSepolia");

  for (const value of [
    "",
    "0x1234",
    `${address}#fragment`,
    `${address}/../../`,
    "not-an-address",
    null,
  ]) {
    assert.throws(() => normalizeContractAddress(value));
  }

  for (const value of ["mainnet", "localhost", "../base", "base ", "", null]) {
    assert.throws(() => normalizeNetworkName(value));
  }
});

test("constructs explorer links from fixed origins", () => {
  assert.equal(
    explorerAddressUrl("baseSepolia", address),
    `https://sepolia.basescan.org/address/${address}#code`,
  );
  assert.equal(
    explorerAddressUrl("base", address),
    `https://basescan.org/address/${address}#code`,
  );
});

test("reads a validated deployment through one stable file descriptor", () => {
  const fixtureRoot = fs.mkdtempSync(join(tmpdir(), "mirage-deployment-"));
  const deploymentsDir = join(fixtureRoot, "deployments");
  fs.mkdirSync(deploymentsDir);
  fs.writeFileSync(
    join(deploymentsDir, "2026-07-29.json"),
    JSON.stringify({ contractAddress: address, network: "baseSepolia" }),
  );

  try {
    assert.deepEqual(readLatestDeployment(deploymentsDir), {
      contractAddress: address,
      networkName: "baseSepolia",
      fileName: "2026-07-29.json",
    });
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("rejects a deployment file replaced with a symlink before open", () => {
  const fixtureRoot = fs.mkdtempSync(join(tmpdir(), "mirage-deployment-race-"));
  const deploymentsDir = join(fixtureRoot, "deployments");
  const deploymentPath = join(deploymentsDir, "2026-07-29.json");
  const outsidePath = join(fixtureRoot, "outside.json");
  fs.mkdirSync(deploymentsDir);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify({ contractAddress: address, network: "base" }),
  );
  fs.writeFileSync(
    outsidePath,
    JSON.stringify({ contractAddress: address, network: "base" }),
  );

  const originalOpenSync = fs.openSync;
  let swapped = false;
  fs.openSync = ((target, flags, mode) => {
    if (!swapped && target === deploymentPath) {
      swapped = true;
      fs.unlinkSync(deploymentPath);
      fs.symlinkSync(outsidePath, deploymentPath);
    }
    return originalOpenSync(target, flags, mode);
  }) as typeof fs.openSync;

  try {
    assert.throws(() => readLatestDeployment(deploymentsDir));
    assert.equal(swapped, true);
  } finally {
    fs.openSync = originalOpenSync;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
