const { getAddress } = require("ethers");

const SUPPORTED_NETWORKS = new Set(["base", "baseSepolia"]);

export function normalizeContractAddress(value: unknown): string {
  if (typeof value !== "string" || value.length !== 42) {
    throw new Error("A valid contract address is required");
  }

  try {
    return getAddress(value);
  } catch {
    throw new Error("A valid contract address is required");
  }
}

export function normalizeNetworkName(value: unknown): "base" | "baseSepolia" {
  if (typeof value !== "string" || !SUPPORTED_NETWORKS.has(value)) {
    throw new Error("Network must be base or baseSepolia");
  }
  return value as "base" | "baseSepolia";
}

export function explorerAddressUrl(
  network: "base" | "baseSepolia",
  contractAddress: string,
): string {
  const origin = network === "base"
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";
  return `${origin}/address/${encodeURIComponent(contractAddress)}#code`;
}
