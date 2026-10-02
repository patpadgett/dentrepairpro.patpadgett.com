// QA capture + probes for dentrepairpro.patpadgett.com
// usage: NODE_PATH=/data/pat/node_modules node tools/qa.js http://localhost:PORT
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const base = process.argv[2] || "http://localhost:8765";
const outDir = path.join(__dirname, "..", ".impeccable", "review");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const results = {};
  for (const [name, vp] of Object.entries({ desktop: { width: 1440, height: 900 }, tablet: { width: 1024, height: 768 }, mobile: { width: 390, height: 844 } })) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: name === "mobile" ? 2 : 1, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const failed = [];
    page.on("requestfailed", (r) => failed.push(r.url()));
    page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
    await page.goto(base + "/index.html", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const probe = await page.evaluate(() => {
      const d = document.documentElement;
      const overflow = d.scrollWidth - d.clientWidth;
      const h1 = document.querySelector("h1");
      const h1s = getComputedStyle(h1);
      const cta = document.querySelector(".hero .actions .plate-light");
      const r = cta.getBoundingClientRect();
      const nav = document.querySelector(".nav");
      const board = document.getElementById("board").getBoundingClientRect();
      const controls = document.querySelector('.board-stage').getBoundingClientRect();
      const copy = document.querySelector(".hero-copy").getBoundingClientRect();
      const plate = document.querySelector(".hero-plate img");
      const plateOk = plate && plate.complete && plate.naturalWidth > 0;
      const overlap = !(board.right <= copy.left || board.left >= copy.right || board.bottom <= copy.top || board.top >= copy.bottom);
      const fontsUsed = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family + " " + f.weight + " " + f.style);
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const wide = [...document.querySelectorAll("body *")].filter(el => el.getBoundingClientRect().right > d.clientWidth + 1).slice(0, 8).map(el => el.tagName + "." + el.className);
      return {
        overflow, wide,
        h1: { font: h1s.fontFamily, size: h1s.fontSize, weight: h1s.fontWeight, lh: h1s.lineHeight, text: h1.textContent },
        ctaInViewport: r.top >= 0 && r.bottom <= innerHeight, ctaRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        navDisplay: nav ? getComputedStyle(nav).display : null,
        board: [Math.round(board.left), Math.round(board.top), Math.round(board.width), Math.round(board.height)],
        copy: [Math.round(copy.left), Math.round(copy.top), Math.round(copy.width), Math.round(copy.height)],
        controls: [Math.round(controls.left), Math.round(controls.top), Math.round(controls.width), Math.round(controls.height)],
        plateOk, cardOverlapsCopy: overlap,
        heroH: Math.round(document.querySelector('.hero').getBoundingClientRect().height),
        canvasShown: getComputedStyle(document.getElementById("board-canvas")).display,
        staticShown: getComputedStyle(document.querySelector(".board-static")).display,
        glClass: d.classList.contains("no-gl") ? "no-gl" : "gl",
        fontsUsed, bodyFont,
        htmlClass: d.className,
        callbar: getComputedStyle(document.getElementById("callbar")).display,
      };
    });
    // interaction probes
    const slider = page.locator("#push");
    const before = await page.locator("#push-status").textContent();
    await slider.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
    const afterKeys = await page.locator("#push-status").textContent();
    const valueText = await slider.getAttribute("aria-valuetext");
    await slider.fill("100");
    await slider.dispatchEvent("input");
    await page.waitForTimeout(250);
    const afterFull = await page.locator("#push-status").textContent();
    const readout = await page.locator("#push-readout").textContent();
    // canvas changed? WebGL without preserveDrawingBuffer reads back blank after compositing,
    // so compare the composited pixels of the demo stage instead
    const stageBox = await page.locator(".board-stage").boundingBox();
    const heroClip = { x: Math.floor(stageBox.x), y: Math.floor(stageBox.y), width: Math.floor(stageBox.width), height: Math.floor(stageBox.height) };
    const shotFull = await page.screenshot({ clip: heroClip });
    await slider.fill("0"); await slider.dispatchEvent("input"); await page.waitForTimeout(400);
    const shotZero = await page.screenshot({ clip: heroClip });
    const canvasHash = shotFull.toString("base64").length + ":" + require("crypto").createHash("md5").update(shotFull).digest("hex");
    const canvasHash0 = shotZero.toString("base64").length + ":" + require("crypto").createHash("md5").update(shotZero).digest("hex");
    // worksheet: the empty state first (buttons must read as unavailable before any input), captured
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.locator("#prepare").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const emptyState = await page.evaluate(() => {
      const b = document.getElementById("copy-notes");
      const cs = getComputedStyle(b);
      return { disabledAttr: b.disabled, cursor: cs.cursor, opacity: cs.opacity, borderStyle: cs.borderStyle, hint: (document.getElementById("readback").textContent || "").trim().slice(0, 60) };
    });
    if (name === "desktop") await page.screenshot({ path: path.join(outDir, "worksheet-empty.png"), fullPage: false });
    await page.fill("#vehicle", "2019 Honda Accord");
    await page.selectOption("#panel-select", "Door");
    for (const [n, v] of [["size", "about the size of a golf ball"], ["count", "one dent"], ["paint", "intact"], ["position", "flat"]]) {
      await page.locator(`input[name="${n}"][value="${v}"] + span`).click();
    }
    const checked = await page.evaluate(() => [...document.querySelectorAll('.choices input:checked')].map(i => i.name + "=" + i.value));
    const readback = await page.locator("#readback").textContent();
    const copyDisabled = await page.locator("#copy-notes").isDisabled();
    // download
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#save-notes")]);
    const dlName = download.suggestedFilename();
    const dlPath = await download.path();
    const dlText = dlPath ? fs.readFileSync(dlPath, "utf8").slice(0, 120) : null;
    // faq
    await page.click(".faq details:nth-of-type(2) summary");
    const faqOpen = await page.locator(".faq details:nth-of-type(2)").getAttribute("open");
    // callbar after scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await page.waitForTimeout(400);
    const callbarVisible = await page.evaluate(() => document.getElementById("callbar").classList.contains("is-visible"));
    // the full-page capture leaves the form filled and the save status showing; clear the
    // status so the screenshot shows the resting state after a real save has happened
    await page.evaluate(() => { const s = document.getElementById("readback-status"); s.textContent = ""; });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const callbarAtTop = await page.evaluate(() => ({ visible: document.getElementById("callbar").classList.contains("is-visible"), rect: document.getElementById("callbar").getBoundingClientRect().toJSON(), scrollY: window.scrollY }));
    // reset form so the screenshot shows the empty state? no: show a filled worksheet as real content
    await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: true });
    results[name] = { ...probe, errors, failed, before, afterKeys, valueText, afterFull, readout, canvasChanged: canvasHash !== canvasHash0, emptyState, readback, checked, copyDisabled, dlName, dlText, faqOpen: faqOpen !== null, callbarVisible, callbarAtTop };
    await ctx.close();
  }
  // no-JS render check
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + "/index.html", { waitUntil: "load" });
  results.nojs = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    staticShown: getComputedStyle(document.querySelector(".board-static")).display,
    canvasShown: getComputedStyle(document.getElementById("board-canvas")).display,
    pushShown: getComputedStyle(document.querySelector(".push")).display,
    copyShown: getComputedStyle(document.getElementById("copy-notes")).display,
    saveShown: getComputedStyle(document.getElementById("save-notes")).display,
    readbackText: (document.getElementById("readback").textContent || "").trim().slice(0, 120),
    heroNote: Array.from(document.querySelectorAll(".board-note")).filter((n) => getComputedStyle(n).display !== "none").map((n) => n.textContent.trim()),
  }));
  await page.screenshot({ path: path.join(outDir, "nojs-hero.png"), fullPage: false });
  await page.locator("#prepare").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "nojs-worksheet.png"), fullPage: false });
  await ctx.close();
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
