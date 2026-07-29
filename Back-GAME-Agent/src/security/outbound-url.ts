import { promises as dns } from "node:dns";
import type { LookupAddress } from "node:dns";
import { Agent as HttpsAgent } from "node:https";
import { BlockList, isIP } from "node:net";

const DETECTOR_PATH = "/api/detect";
const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:5001",
  "http://127.0.0.1:5001",
  "http://[::1]:5001",
]);

const blockedAddresses = new BlockList();
const blockedIpv4Subnets: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];
blockedIpv4Subnets.forEach(([address, prefix]) => {
  blockedAddresses.addSubnet(address, prefix, "ipv4");
});

blockedAddresses.addAddress("::", "ipv6");
blockedAddresses.addAddress("::1", "ipv6");
blockedAddresses.addSubnet("100::", 64, "ipv6");
blockedAddresses.addSubnet("2001::", 32, "ipv6");
blockedAddresses.addSubnet("2001:2::", 48, "ipv6");
blockedAddresses.addSubnet("2001:10::", 28, "ipv6");
blockedAddresses.addSubnet("2001:20::", 28, "ipv6");
blockedAddresses.addSubnet("2001:db8::", 32, "ipv6");
blockedAddresses.addSubnet("2002::", 16, "ipv6");
blockedAddresses.addSubnet("3fff::", 20, "ipv6");
blockedAddresses.addSubnet("fc00::", 7, "ipv6");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");
blockedAddresses.addSubnet("ff00::", 8, "ipv6");

export interface DetectorUrlOptions {
  environment?: string;
  allowedOrigins?: string | readonly string[];
}

export type AddressResolver = (hostname: string) => Promise<readonly LookupAddress[]>;

export interface PreparedDetectorRequest {
  requestUrl: string;
  hostHeader?: string;
  httpsAgent?: HttpsAgent;
}

function canonicalizeHostname(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function parseAllowedOrigins(value: string | readonly string[] | undefined): Set<string> {
  const entries: readonly string[] = typeof value === "string"
    ? value.split(",").map((entry) => entry.trim()).filter(Boolean)
    : (value ?? []);

  return new Set(entries.map((entry) => {
    if (/[\u0000-\u001f\u007f\\\s]/u.test(entry) || entry.includes("*")) {
      throw new Error("Detector allowlist entries must be canonical HTTPS origins");
    }

    const url = new URL(entry);
    const hostname = canonicalizeHostname(url.hostname);
    if (
      entry !== url.origin ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      isIP(hostname) !== 0 ||
      !hostname.includes(".")
    ) {
      throw new Error("Detector allowlist entries must be canonical HTTPS host origins");
    }
    return url.origin;
  }));
}

export function isPublicIpAddress(address: string): boolean {
  const normalized = canonicalizeHostname(address);
  const family = isIP(normalized);

  if (family === 4) {
    return !blockedAddresses.check(normalized, "ipv4");
  }
  if (family === 6) {
    if (normalized.toLowerCase().startsWith("::ffff:")) {
      return false;
    }
    if (blockedAddresses.check(normalized, "ipv6")) {
      return false;
    }
    const firstGroup = Number.parseInt(normalized.split(":", 1)[0] || "0", 16);
    return firstGroup >= 0x2000 && firstGroup <= 0x3fff;
  }
  return false;
}

export function validateTextDetectorUrl(
  rawUrl: string,
  options: DetectorUrlOptions = {},
): URL {
  if (
    !rawUrl ||
    rawUrl !== rawUrl.trim() ||
    /[\u0000-\u001f\u007f\\]/u.test(rawUrl)
  ) {
    throw new Error("TEXT_DETECTOR_API_URL must be a canonical URL");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("TEXT_DETECTOR_API_URL is invalid");
  }

  if (
    rawUrl !== url.toString() ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== DETECTOR_PATH
  ) {
    throw new Error("TEXT_DETECTOR_API_URL must be a credential-free canonical detector endpoint");
  }

  const hostname = canonicalizeHostname(url.hostname);
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const isDevelopment = environment === "development" || environment === "test";

  if (LOCAL_DEVELOPMENT_ORIGINS.has(url.origin)) {
    if (!isDevelopment) {
      throw new Error("Local detector endpoints are disabled outside development and test");
    }
    return url;
  }

  if (
    url.protocol !== "https:" ||
    isIP(hostname) !== 0 ||
    !hostname.includes(".") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa")
  ) {
    throw new Error("Remote detector endpoints must use an allowlisted public HTTPS hostname");
  }

  const allowedOrigins = parseAllowedOrigins(options.allowedOrigins);
  if (!allowedOrigins.has(url.origin)) {
    throw new Error("The detector origin is not in TEXT_DETECTOR_ALLOWED_ORIGINS");
  }

  return url;
}

const defaultResolver: AddressResolver = (hostname) =>
  dns.lookup(hostname, { all: true, verbatim: true });

/**
 * Resolve once, reject any mixed public/private answer, and connect to a pinned
 * public address while retaining the original hostname for Host and TLS SNI.
 */
export async function prepareDetectorRequest(
  target: URL,
  resolver: AddressResolver = defaultResolver,
): Promise<PreparedDetectorRequest> {
  if (target.protocol === "http:") {
    return { requestUrl: target.toString() };
  }
  if (target.protocol !== "https:") {
    throw new Error("Unsupported detector protocol");
  }

  const hostname = canonicalizeHostname(target.hostname);
  const addresses = await resolver(hostname);
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new Error("The detector hostname did not resolve exclusively to public addresses");
  }

  const selected = addresses[0];
  const pinnedUrl = new URL(target.toString());
  pinnedUrl.host = selected.family === 6
    ? `[${selected.address}]${target.port ? `:${target.port}` : ""}`
    : `${selected.address}${target.port ? `:${target.port}` : ""}`;

  return {
    requestUrl: pinnedUrl.toString(),
    hostHeader: target.host,
    httpsAgent: new HttpsAgent({
      keepAlive: false,
      rejectUnauthorized: true,
      servername: hostname,
    }),
  };
}
