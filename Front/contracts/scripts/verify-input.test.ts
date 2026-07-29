import assert from "node:assert/strict";
import test from "node:test";
import {
  explorerAddressUrl,
  normalizeContractAddress,
  normalizeNetworkName,
} from "./verify-input.js";

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
