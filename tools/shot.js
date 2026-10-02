// Screenshot a tools/ page with query params. usage: node tools/shot.js "<query>" out.png [w] [h] [page=panel-test.html]
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const query = process.argv[2] || "";
  const out = process.argv[3] || "/data/pat/.hermes/cache/scratch/panel.png";
  const w = +process.argv[4] || 1440, h = +process.argv[5] || 900;
  const page = process.argv[6] || "panel-test.html";
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("pageerror", (e) => console.error("pageerror", String(e)));
  await p.goto("http://127.0.0.1:8765/tools/" + page + "?" + query);
  await p.waitForTimeout(400);
  console.log(await p.title());
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
  await b.close();
  console.log("wrote", out);
})();
