// Render the favicon set from the site's own mark (assets/mark.svg) with Playwright:
// favicon.ico (16/32/48 as a multi-size PNG-in-ICO), assets/apple-touch-icon.png (180), assets/icon-512.png.
// usage: NODE_PATH=/data/pat/node_modules node tools/icons.js [http://127.0.0.1:8765]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const base = process.argv[2] || "http://127.0.0.1:8765";
const assets = path.resolve(__dirname, "..", "assets");
const root = path.resolve(__dirname, "..");

async function shot(page, size, pad) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#15309a">
    <img src="${base}/assets/mark.svg" style="display:block;width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">
    </body></html>`);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: false });
}

// minimal ICO container with PNG entries
function ico(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);
  const dirs = [];
  let offset = 6 + 16 * count;
  const bodies = [];
  for (const { size, buf } of pngs) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0); d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt8(0, 2); d.writeUInt8(0, 3); d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
    d.writeUInt32LE(buf.length, 8); d.writeUInt32LE(offset, 12);
    offset += buf.length; dirs.push(d); bodies.push(buf);
  }
  return Buffer.concat([header, ...dirs, ...bodies]);
}

(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await (await b.newContext({ deviceScaleFactor: 1 })).newPage();
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const s of sizes) pngs.push({ size: s, buf: await shot(page, s, 0) });
  fs.writeFileSync(path.join(root, "favicon.ico"), ico(pngs));
  fs.writeFileSync(path.join(assets, "apple-touch-icon.png"), await shot(page, 180, 0));
  fs.writeFileSync(path.join(assets, "icon-512.png"), await shot(page, 512, 0));
  await b.close();
  for (const f of ["favicon.ico", "assets/apple-touch-icon.png", "assets/icon-512.png"]) console.log("wrote", f, fs.statSync(path.join(root, f)).size, "bytes");
})().catch((e) => { console.error(e); process.exit(1); });
