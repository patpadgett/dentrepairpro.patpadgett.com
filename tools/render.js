// Render the static panel assets from tools/render.html (the same WebGL program the hero uses).
// usage: NODE_PATH=/data/pat/node_modules node tools/render.js [http://127.0.0.1:8765]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const base = process.argv[2] || "http://127.0.0.1:8765";
const assets = path.resolve(__dirname, "..", "assets");
const embed = "/data/pat/.hermes/skills/creative/impeccable/scripts/impeccable";

const JOBS = [
  { preset: "demo",     out: "demo-static.jpg",    w: 640,  h: 400, q: 86 },
  { preset: "read",     out: "plate-read.jpg",     w: 640,  h: 400, q: 86 },
  { preset: "push",     out: "plate-push.jpg",     w: 640,  h: 400, q: 86 },
  { preset: "straight", out: "plate-straight.jpg", w: 640,  h: 400, q: 86 },
];

const PROMPT = (preset) => `Rendered by tools/render.js (Playwright/Chromium, SwiftShader) from tools/render.html preset "${preset}" using panel.js, the site's own WebGL program: a crowned blue painted steel skin (#1A3BB4 over #0B1B5E) with orange-peel ripple, reflecting a striped PDR line board and a warm lamp; the door ding is a monotonic radial pull on the reflected board plus a shaded bowl. Diagrammatic illustration, not a photograph. No AI image generation.`;

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  for (const j of JOBS) {
    const ctx = await b.newContext({ viewport: { width: j.w, height: j.h } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => console.error("pageerror", String(e)));
    await p.goto(`${base}/tools/render.html?preset=${j.preset}`);
    await p.waitForTimeout(400);
    const title = await p.title();
    if (!title.startsWith("gl ok")) throw new Error("WebGL unavailable for " + j.preset);
    const out = path.join(assets, j.out);
    await p.screenshot({ path: out, type: "jpeg", quality: j.q, clip: { x: 0, y: 0, width: j.w, height: j.h } });
    execFileSync(embed, ["embed-prompt", out, "--prompt", PROMPT(j.preset)], { stdio: "inherit" });
    console.log("wrote", out, fs.statSync(out).size, "bytes");
    await ctx.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
