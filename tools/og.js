// Render assets/og.png from tools/og.html (served over http so panel.js and fonts load the same way as the site)
const { chromium } = require("playwright");
const path = require("path");
const { execFileSync } = require("child_process");
const base = process.argv[2] || "http://127.0.0.1:8765";
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
  await p.goto(base + "/tools/og.html");
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  await p.waitForTimeout(400);
  if (!(await p.title()).startsWith("gl ok")) throw new Error("WebGL unavailable");
  const out = path.resolve(__dirname, "..", "assets", "og.png");
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await b.close();
  execFileSync("/data/pat/.hermes/skills/creative/impeccable/scripts/impeccable", ["embed-prompt", out, "--prompt",
    "Rendered by tools/og.js from tools/og.html with Playwright/Chromium: the site's hero plate assets/hero-desktop.jpg (see its own embedded provenance) under a blue wash, headline 'The lines don't lie.' in Big Shoulders Display 800, Archivo footer."], { stdio: "inherit" });
  console.log("wrote", out);
})().catch((e) => { console.error(e); process.exit(1); });
