import { CID } from "multiformats/cid";

export const PINATA_API_ORIGIN = "https://api.pinata.cloud";
export const PINATA_GATEWAY_ORIGIN = "https://gateway.pinata.cloud";

const MAX_CID_LENGTH = 128;

/**
 * Accept only a canonical, standalone IPFS CID. Paths, URLs, whitespace,
 * percent-encoding, and alternate textual encodings are deliberately rejected.
 */
export function normalizeIpfsCid(input: string): string {
  if (!input || input.length > MAX_CID_LENGTH || input !== input.trim()) {
    throw new Error("A canonical IPFS CID is required");
  }
  if (/[/%\\?#@\s]/.test(input)) {
    throw new Error("IPFS paths and encoded CID values are not accepted");
  }

  let canonical: string;
  try {
    canonical = CID.parse(input).toString();
  } catch {
    throw new Error("Invalid IPFS CID");
  }

  if (canonical !== input) {
    throw new Error("The IPFS CID must use its canonical encoding");
  }
  return canonical;
}

export function buildPinataGatewayUrl(input: string): URL {
  const cid = normalizeIpfsCid(input);
  const url = new URL(`/ipfs/${encodeURIComponent(cid)}`, PINATA_GATEWAY_ORIGIN);

  if (
    url.protocol !== "https:" ||
    url.origin !== PINATA_GATEWAY_ORIGIN ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== `/ipfs/${cid}`
  ) {
    throw new Error("Unsafe Pinata gateway URL");
  }

  return url;
}

export function buildPinataPinListUrl(input: string): URL {
  const cid = normalizeIpfsCid(input);
  const url = new URL("/data/pinList", PINATA_API_ORIGIN);
  url.searchParams.set("hashContains", cid);

  if (
    url.protocol !== "https:" ||
    url.origin !== PINATA_API_ORIGIN ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error("Unsafe Pinata API URL");
  }

  return url;
}
