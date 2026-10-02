// Build the hero plates: a Flux-rendered paint plate (tools/gen_t2i.py, prompt-t2i-c) composited with the
// line board's reflection by tools/composite.html, written as JPEG with provenance embedded.
// usage: NODE_PATH=/data/pat/node_modules node tools/hero.js [http://127.0.0.1:8765]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const base = process.argv[2] || "http://127.0.0.1:8765";
const assets = path.resolve(__dirname, "..", "assets");
const embed = "/data/pat/.hermes/skills/creative/impeccable/scripts/impeccable";
const PLATE = "../.impeccable/plates/paint-s5.png";

const JOBS = [
  { out: "hero-desktop.jpg", w: 1920, h: 1200, q: 82,
    query: `plate=${PLATE}&w=1920&h=1200&fx=0.5&fy=0.6&dent=0.715,0.50&lamp=0.66,0.30&quad=0.52,0.22,1.02,0.10,1.04,0.88,0.50,0.78&blur=5&dark=0.62&lines=10&peel=1.6&edge=0.07` },
  { out: "hero-mobile.jpg", w: 780, h: 1200, q: 82,
    query: `plate=${PLATE}&w=780&h=1200&fx=0.62&fy=0.5&dent=0.56,0.60&lamp=0.40,0.40&quad=0.06,0.42,1.04,0.34,1.06,0.90,0.04,0.86&blur=4&dark=0.62&lines=9&peel=1.6&edge=0.07&sigma=0.075` },
];

const PROMPT = (j) => `Composite illustration, not a photograph. Paint plate: generated locally with ComfyUI (Flux.1 Schnell FP8, 4 steps, 1344x768, seed 5) from tools/prompt-t2i-c.txt ("dark metallic blue car door in a dim repair shop ... no stripes"), file .impeccable/plates/paint-s5.png. The PDR line board's reflection, its frame, the door's crown, orange peel and the single door ding (a monotonic radial lens) were drawn over it by tools/composite.html with the query "${j.query}" and captured by tools/hero.js (Playwright/Chromium). No real vehicle or customer repair is depicted.`;

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  for (const j of JOBS) {
    const ctx = await b.newContext({ viewport: { width: j.w, height: j.h } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => console.error("pageerror", String(e)));
    await p.goto(`${base}/tools/composite.html?${j.query}`);
    await p.waitForFunction(() => document.title === "ok" || document.title === "plate failed", null, { timeout: 120000 });
    if ((await p.title()) !== "ok") throw new Error("composite failed for " + j.out);
    const out = path.join(assets, j.out);
    await p.screenshot({ path: out, type: "jpeg", quality: j.q, clip: { x: 0, y: 0, width: j.w, height: j.h } });
    execFileSync(embed, ["embed-prompt", out, "--prompt", PROMPT(j)], { stdio: "inherit" });
    console.log("wrote", out, fs.statSync(out).size, "bytes");
    await ctx.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
