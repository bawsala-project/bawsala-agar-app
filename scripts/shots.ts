import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ROUTES = [
  { name: "01_welcome", path: "/welcome" },
  { name: "02_start", path: "/start" },
  { name: "03_needs", path: "/case/demo/needs" },
  { name: "04_properties", path: "/case/demo/properties" },
  { name: "05_preflight", path: "/case/demo/preflight" },
  { name: "06_checkout", path: "/case/demo/checkout" },
  { name: "07_analyzing", path: "/case/demo/analyzing" },
  { name: "08_results", path: "/case/demo/results" },
  { name: "09_property_p1", path: "/case/demo/property/p1" },
  { name: "10_compare", path: "/case/demo/compare" },
  { name: "11_inspection", path: "/case/demo/inspection" },
  { name: "12_reassess", path: "/case/demo/reassess" },
  { name: "13_dashboard", path: "/dashboard" },
  { name: "14_styleguide", path: "/styleguide" },
];

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Set sessionStorage flag so welcome doesn't replay the 3.6s intro sequence on every shot
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("bawsala_intro_seen", "true");
    } catch {}
  });

  console.log("Starting screenshots capture at 393x852...");

  for (const route of ROUTES) {
    const url = `http://localhost:3000${route.path}`;
    console.log(`Capturing ${route.name} from ${url}...`);
    let captured = false;
    for (let attempt = 1; attempt <= 2 && !captured; attempt++) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        // Settle time for animations and fonts
        await page.waitForTimeout(1200);
        const outPath = path.join(screenshotsDir, `${route.name}_393x852.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`Saved -> ${outPath}`);
        captured = true;
      } catch (err) {
        if (attempt === 2) {
          console.error(`Error capturing ${route.name}:`, err);
        } else {
          await page.waitForTimeout(1000);
        }
      }
    }
  }

  // Also capture the presentation shell at desktop size
  console.log("Capturing presentation shell at 1440x900...");
  const shellContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const shellPage = await shellContext.newPage();
  try {
    await shellPage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await shellPage.waitForTimeout(1500);
    const shellOut = path.join(screenshotsDir, "00_shell_1440x900.png");
    await shellPage.screenshot({ path: shellOut });
    console.log(`Saved -> ${shellOut}`);
  } catch (err) {
    console.error("Error capturing shell:", err);
  }

  await browser.close();
  console.log("All screenshots completed successfully.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
