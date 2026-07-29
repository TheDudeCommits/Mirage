const { getAddress } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");

const SUPPORTED_NETWORKS = new Set(["base", "baseSepolia"]);
const MAX_DEPLOYMENT_BYTES = 64 * 1024;

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

export function readLatestDeployment(deploymentsDirValue: string): {
  contractAddress: string;
  networkName: "base" | "baseSepolia";
  fileName: string;
} {
  const deploymentsDir = path.resolve(deploymentsDirValue);
  const files = fs.readdirSync(deploymentsDir, { withFileTypes: true })
    .filter((entry: import("node:fs").Dirent) =>
      entry.isFile() &&
      /^[A-Za-z0-9._-]+\.json$/.test(entry.name) &&
      !entry.name.includes("abi")
    )
    .map((entry: import("node:fs").Dirent) => entry.name)
    .sort()
    .reverse();

  const latestFile = files[0];
  if (!latestFile) {
    throw new Error("No deployment file found");
  }

  const deploymentPath = path.resolve(deploymentsDir, latestFile);
  if (path.dirname(deploymentPath) !== deploymentsDir) {
    throw new Error("Unsafe deployment path");
  }

  const { O_RDONLY, O_NOFOLLOW, O_NONBLOCK } = fs.constants;
  if (
    typeof O_RDONLY !== "number" ||
    typeof O_NOFOLLOW !== "number" ||
    typeof O_NONBLOCK !== "number"
  ) {
    throw new Error("Secure deployment file access is not supported");
  }
  const flags = O_RDONLY | O_NOFOLLOW | O_NONBLOCK;
  const descriptor = fs.openSync(deploymentPath, flags);
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size > MAX_DEPLOYMENT_BYTES) {
      throw new Error("Invalid deployment file");
    }

    const deployment = JSON.parse(fs.readFileSync(descriptor, "utf8"));
    return {
      contractAddress: normalizeContractAddress(deployment.contractAddress),
      networkName: normalizeNetworkName(deployment.network),
      fileName: latestFile,
    };
  } finally {
    fs.closeSync(descriptor);
  }
}
