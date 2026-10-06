import "server-only";
import dns from "node:dns";
import net from "node:net";
import { parse } from "node-html-parser";

export type FetchListingErrorCode =
  | "blocked_host"
  | "timeout"
  | "too_large"
  | "not_html"
  | "http_error"
  | "empty";

export type FetchListingResult =
  | { ok: true; text: string }
  | { ok: false; code: FetchListingErrorCode };

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TIMEOUT_MS = 10_000; // 10s
const MAX_REDIRECTS = 3;
const MAX_TEXT_CHARS = 50_000;

export function isBlockedIp(ip: string): boolean {
  if (ip.startsWith("::ffff:")) {
    const ipv4 = ip.substring(7);
    if (net.isIPv4(ipv4)) {
      return isBlockedIp(ipv4);
    }
  }

  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [a, b, c] = parts;

    // 0.0.0.0/8
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Shared / Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Test nets)
    if (a === 192 && b === 0 && c === 2) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    // 198.18.0.0/15 (Benchmark)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // Loopback
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    // Unspecified
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    // Unique Local Address (ULA) fc00::/7
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // Link-local fe80::/10
    if (/^fe[89ab]/i.test(lower)) return true;
    // Multicast ff00::/8
    if (lower.startsWith("ff")) return true;
    // Discard
    if (lower.startsWith("100::") || lower.startsWith("0100::")) return true;
    // Documentation 2001:db8::
    if (lower.startsWith("2001:db8:") || lower.startsWith("2001:0db8:")) return true;

    return false;
  }

  return true;
}

export type DnsLookupFn = (hostname: string) => Promise<{ address: string; family: number }[]>;

export const defaultDnsLookup: DnsLookupFn = async (hostname: string) => {
  return dns.promises.lookup(hostname, { all: true });
};

export async function validateUrl(
  rawUrl: string,
  dnsLookup: DnsLookupFn = defaultDnsLookup
): Promise<{ ok: true; url: URL } | { ok: false; code: "blocked_host" }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { ok: false, code: "blocked_host" };
  }

  // https only
  if (parsedUrl.protocol !== "https:") {
    return { ok: false, code: "blocked_host" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    return { ok: false, code: "blocked_host" };
  }

  // If hostname is directly an IP
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      return { ok: false, code: "blocked_host" };
    }
    return { ok: true, url: parsedUrl };
  }

  // Resolve hostname with DNS
  try {
    const addresses = await dnsLookup(hostname);
    if (!addresses || addresses.length === 0) {
      return { ok: false, code: "blocked_host" };
    }
    for (const record of addresses) {
      if (isBlockedIp(record.address)) {
        return { ok: false, code: "blocked_host" };
      }
    }
  } catch {
    return { ok: false, code: "blocked_host" };
  }

  return { ok: true, url: parsedUrl };
}

export function htmlToPlainText(html: string): string {
  const root = parse(html);

  // Extract <title>
  const title = root.querySelector("title")?.text.trim() || "";

  // Extract meta description
  const metaDesc =
    root.querySelector('meta[name="description" i]')?.getAttribute("content")?.trim() || "";

  // Extract og:* tags
  const ogTags: string[] = [];
  const metas = root.querySelectorAll("meta");
  for (const meta of metas) {
    const prop = meta.getAttribute("property") || meta.getAttribute("name");
    const content = meta.getAttribute("content");
    if (prop && prop.toLowerCase().startsWith("og:") && content) {
      ogTags.push(`${prop}: ${content.trim()}`);
    }
  }

  // Extract JSON-LD blocks
  const jsonLdBlocks: string[] = [];
  const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    const text = script.text.trim();
    if (text) {
      jsonLdBlocks.push(text);
    }
  }

  // Remove script, style, nav, footer, noscript, svg
  const elementsToRemove = root.querySelectorAll("script, style, nav, footer, noscript, svg");
  for (const el of elementsToRemove) {
    el.remove();
  }

  const bodyText = (root.querySelector("body") || root).text || "";

  const pieces: string[] = [];
  if (title) pieces.push(`[العنوان]: ${title}`);
  if (metaDesc) pieces.push(`[الوصف]: ${metaDesc}`);
  if (ogTags.length > 0) pieces.push(`[بيانات OpenGraph]:\n${ogTags.join("\n")}`);
  if (jsonLdBlocks.length > 0) pieces.push(`[بيانات هيكلية JSON-LD]:\n${jsonLdBlocks.join("\n")}`);
  if (bodyText.trim()) pieces.push(`[محتوى الصفحة]:\n${bodyText}`);

  const combined = pieces.join("\n\n");
  const collapsed = combined.replace(/\s+/g, " ").trim();

  return collapsed.slice(0, MAX_TEXT_CHARS);
}

export async function fetchListing(
  initialUrl: string,
  options?: {
    dnsLookup?: DnsLookupFn;
    fetchImpl?: typeof fetch;
  }
): Promise<FetchListingResult> {
  const dnsLookup = options?.dnsLookup ?? defaultDnsLookup;
  const customFetch = options?.fetchImpl ?? fetch;

  let currentUrl = initialUrl;
  let redirectsRemaining = MAX_REDIRECTS;

  while (true) {
    const urlValidation = await validateUrl(currentUrl, dnsLookup);
    if (!urlValidation.ok) {
      return { ok: false, code: "blocked_host" };
    }

    try {
      const signal = AbortSignal.timeout(TIMEOUT_MS);
      const res = await customFetch(urlValidation.url.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal,
      });

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        if (redirectsRemaining <= 0) {
          return { ok: false, code: "http_error" };
        }
        redirectsRemaining--;

        const location = res.headers.get("location");
        if (!location) {
          return { ok: false, code: "http_error" };
        }

        try {
          const nextUrl = new URL(location, currentUrl);
          currentUrl = nextUrl.toString();
          continue;
        } catch {
          return { ok: false, code: "http_error" };
        }
      }

      if (res.status < 200 || res.status >= 300) {
        return { ok: false, code: "http_error" };
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("text/html")) {
        return { ok: false, code: "not_html" };
      }

      const contentLengthHeader = res.headers.get("content-length");
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_BYTES) {
        return { ok: false, code: "too_large" };
      }

      // Stream read with size limit
      if (!res.body) {
        return { ok: false, code: "empty" };
      }

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_BYTES) {
            await reader.cancel();
            return { ok: false, code: "too_large" };
          }
          chunks.push(value);
        }
      }

      const buffer = Buffer.concat(chunks);
      const html = new TextDecoder("utf-8").decode(buffer);
      const plainText = htmlToPlainText(html);

      if (!plainText || plainText.trim().length === 0) {
        return { ok: false, code: "empty" };
      }

      return { ok: true, text: plainText };
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        return { ok: false, code: "timeout" };
      }
      return { ok: false, code: "http_error" };
    }
  }
}
