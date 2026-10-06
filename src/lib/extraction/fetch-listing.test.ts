import { describe, it, expect } from "vitest";
import { fetchListing, htmlToPlainText, isBlockedIp } from "./fetch-listing";

describe("isBlockedIp", () => {
  it("blocks loopback and private IPv4", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.1")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("0.0.0.0")).toBe(true);
  });

  it("blocks IPv6 loopback, unspecified, and private/link-local", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("::")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fd12:3456:789a::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:10.1.2.3")).toBe(true);
  });

  it("allows public IPv4 and IPv6", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("2607:f8b0:4005:805::200e")).toBe(false);
  });
});

describe("fetchListing", () => {
  it("rejects http:// URLs", async () => {
    const res = await fetchListing("http://example.com/listing");
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects https://127.0.0.1", async () => {
    const res = await fetchListing("https://127.0.0.1/listing");
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects https://localhost", async () => {
    const res = await fetchListing("https://localhost:3000/listing");
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects https://169.254.169.254 (metadata service)", async () => {
    const res = await fetchListing("https://169.254.169.254/latest/meta-data");
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects a hostname resolving to 10.x", async () => {
    const mockDns = async () => [{ address: "10.0.1.5", family: 4 }];
    const res = await fetchListing("https://internal.company.com/page", {
      dnsLookup: mockDns,
    });
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects a redirect to a private IP", async () => {
    const mockDns = async (host: string) => {
      if (host === "public-gateway.com") {
        return [{ address: "93.184.216.34", family: 4 }];
      }
      return [{ address: "192.168.1.100", family: 4 }];
    };

    const mockFetch = async (input: RequestInfo | URL) => {
      const urlStr = input.toString();
      if (urlStr.includes("public-gateway.com")) {
        return new Response(null, {
          status: 302,
          headers: { location: "https://internal-host.com/private" },
        });
      }
      return new Response("ok", { status: 200, headers: { "content-type": "text/html" } });
    };

    const res = await fetchListing("https://public-gateway.com/start", {
      dnsLookup: mockDns,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(res).toEqual({ ok: false, code: "blocked_host" });
  });

  it("rejects response larger than 2MB", async () => {
    const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
    const mockFetch = async () => {
      return new Response("huge content", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-length": (3 * 1024 * 1024).toString(),
        },
      });
    };

    const res = await fetchListing("https://example.com/big", {
      dnsLookup: mockDns,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(res).toEqual({ ok: false, code: "too_large" });
  });

  it("rejects non-HTML responses", async () => {
    const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
    const mockFetch = async () => {
      return new Response('{"key":"value"}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const res = await fetchListing("https://example.com/api", {
      dnsLookup: mockDns,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(res).toEqual({ ok: false, code: "not_html" });
  });

  it("successfully fetches valid HTML and returns extracted plain text", async () => {
    const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
    const mockFetch = async () => {
      return new Response(
        '<!DOCTYPE html><html><head><title>العقار المميز</title></head><body><p>السعر 500,000</p></body></html>',
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }
      );
    };

    const res = await fetchListing("https://example.com/listing", {
      dnsLookup: mockDns,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.text).toContain("العقار المميز");
      expect(res.text).toContain("500,000");
    }
  });

  it("returns empty error code when HTML body yields no text", async () => {
    const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
    const mockFetch = async () => {
      return new Response("<html><body></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    };

    const res = await fetchListing("https://example.com/empty", {
      dnsLookup: mockDns,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(res).toEqual({ ok: false, code: "empty" });
  });
});

describe("htmlToPlainText", () => {
  it("extracts title, meta description, OpenGraph, JSON-LD and strips scripts/styles", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>شقة للبيع في الرياض</title>
          <meta name="description" content="شقة فاخرة بحي النرجس" />
          <meta property="og:title" content="شقة للبيع" />
          <script type="application/ld+json">{"@type": "Product", "name": "شقة"}</script>
          <style>body { color: red; }</style>
          <script>console.log("secret script");</script>
        </head>
        <body>
          <nav>قائمة الموقع</nav>
          <main>
            <h1>تفاصيل العقار</h1>
            <p>السعر: 850,000 ريال</p>
          </main>
          <footer>جميع الحقوق محفوظة</footer>
        </body>
      </html>
    `;

    const text = htmlToPlainText(html);
    expect(text).toContain("شقة للبيع في الرياض");
    expect(text).toContain("شقة فاخرة بحي النرجس");
    expect(text).toContain("og:title: شقة للبيع");
    expect(text).toContain('{"@type": "Product", "name": "شقة"}');
    expect(text).toContain("السعر: 850,000 ريال");
    expect(text).not.toContain("console.log");
    expect(text).not.toContain("قائمة الموقع");
    expect(text).not.toContain("جميع الحقوق محفوظة");
  });
});
