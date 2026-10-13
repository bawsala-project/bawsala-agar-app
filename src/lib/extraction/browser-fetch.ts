import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

export interface BrowserFetchResult {
  ok: boolean;
  text?: string;
  error?: string;
}

const CANDIDATE_BROWSER_PATHS = [
  // Windows Edge
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  // Windows Chrome
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  // Mac
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

export function findBrowserExecutable(): string | null {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  for (const p of CANDIDATE_BROWSER_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function fetchViaHeadlessBrowser(
  targetUrl: string,
  timeoutMs = 20_000
): Promise<BrowserFetchResult> {
  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    return { ok: false, error: "No browser executable found on system" };
  }

  // Pick random port between 9230 and 9290
  const port = 9230 + Math.floor(Math.random() * 60);
  const tmpDir = path.join(
    os.tmpdir(),
    `bawsala_browser_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {
    // ignore
  }

  return new Promise<BrowserFetchResult>((resolve) => {
    let resolved = false;
    let proc: ReturnType<typeof spawn> | null = null;

    const cleanup = () => {
      if (proc) {
        try {
          proc.kill("SIGKILL");
        } catch {
          // ignore
        }
        proc = null;
      }
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    };

    const finish = (result: BrowserFetchResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: "timeout" });
    }, timeoutMs);

    try {
      proc = spawn(browserPath, [
        "--headless=new",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${tmpDir}`,
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-blink-features=AutomationControlled",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
      ]);

      proc.on("error", (err) => {
        clearTimeout(timer);
        finish({ ok: false, error: err.message });
      });

      // Poll until CDP is ready (up to 3s)
      const startTime = Date.now();
      const checkCdpReady = () => {
        if (resolved) return;
        const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
          if (res.statusCode === 200) {
            // CDP ready -> navigate to target URL
            openTabAndExtract();
          } else {
            retry();
          }
        });
        req.on("error", () => retry());

        function retry() {
          if (Date.now() - startTime < 3500) {
            setTimeout(checkCdpReady, 200);
          } else {
            clearTimeout(timer);
            finish({ ok: false, error: "CDP did not become ready in time" });
          }
        }
      };

      const openTabAndExtract = () => {
        const createReq = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: `/json/new?${encodeURIComponent(targetUrl)}`,
            method: "PUT",
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const tab = JSON.parse(data);
                const wsUrl = tab.webSocketDebuggerUrl;
                if (!wsUrl) {
                  clearTimeout(timer);
                  finish({ ok: false, error: "Missing webSocketDebuggerUrl" });
                  return;
                }

                // Wait 4 seconds for page rendering & Next.js hydration
                setTimeout(() => {
                  try {
                    const ws = new WebSocket(wsUrl);
                    ws.onopen = () => {
                      ws.send(
                        JSON.stringify({
                          id: 1,
                          method: "Runtime.evaluate",
                          params: {
                            expression: `
                              (function() {
                                var title = document.title || "";
                                var nextData = "";
                                if (window.__NEXT_DATA__?.props?.pageProps) {
                                  try {
                                    nextData = "[بيانات المنصة]: " + JSON.stringify(window.__NEXT_DATA__.props.pageProps) + "\\n\\n";
                                  } catch (e) {}
                                }
                                var bodyText = document.body ? document.body.innerText : "";
                                return title + "\\n\\n" + nextData + bodyText;
                              })()
                            `,
                          },
                        })
                      );
                    };

                    ws.onmessage = (msg) => {
                      try {
                        const parsed = JSON.parse(msg.data as string);
                        const value = parsed?.result?.result?.value;
                        clearTimeout(timer);
                        ws.close();
                        if (typeof value === "string" && value.trim().length > 50) {
                          finish({ ok: true, text: value.trim() });
                        } else {
                          finish({ ok: false, error: "Empty page text returned" });
                        }
                      } catch (err: unknown) {
                        clearTimeout(timer);
                        ws.close();
                        finish({
                          ok: false,
                          error: err instanceof Error ? err.message : "Parse error",
                        });
                      }
                    };

                    ws.onerror = () => {
                      clearTimeout(timer);
                      finish({ ok: false, error: "WebSocket error" });
                    };
                  } catch (wsErr: unknown) {
                    clearTimeout(timer);
                    finish({
                      ok: false,
                      error: wsErr instanceof Error ? wsErr.message : "WS error",
                    });
                  }
                }, 4000);
              } catch (parseErr: unknown) {
                clearTimeout(timer);
                finish({
                  ok: false,
                  error: parseErr instanceof Error ? parseErr.message : "JSON error",
                });
              }
            });
          }
        );

        createReq.on("error", (err) => {
          clearTimeout(timer);
          finish({ ok: false, error: err.message });
        });
        createReq.end();
      };

      setTimeout(checkCdpReady, 250);
    } catch (launchErr: unknown) {
      clearTimeout(timer);
      finish({
        ok: false,
        error: launchErr instanceof Error ? launchErr.message : "Launch error",
      });
    }
  });
}
