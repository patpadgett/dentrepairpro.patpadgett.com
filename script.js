/* Dent Repair Pro — the panel, the lamp, the worksheet, and the call bar.
   Everything here runs on the visitor's device. Nothing is sent anywhere. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var CALL_NUMBER = "(816) 694-6288";

  /* ------------------------------------------------------------------ */
  /* The panel: painted steel under a line board, rendered by panel.js   */
  /* ------------------------------------------------------------------ */

  var board = document.getElementById("board");
  var canvas = document.getElementById("board-canvas");
  var slider = document.getElementById("push");
  var readout = document.getElementById("push-readout");
  var status = document.getElementById("push-status");
  var hero = document.querySelector(".hero");
  var stage = document.querySelector(".board-stage");

  var panel = null;
  try {
    panel = (canvas && window.DRPPanel) ? window.DRPPanel.create(canvas, { paint: "#1A3BB4", paintDeep: "#0B1B5E" }) : null;
  } catch (e) { panel = null; }
  var gl = panel && panel.gl;
  if (!gl) document.documentElement.classList.add("no-gl");

  var W = 0, H = 0, dpr = 1;
  var depth = 1, targetDepth = 1;      // 1 = the ding as found, 0 = flat
  var lampDefault = { x: 0.36, y: 0.24 };
  var lamp = { x: 0.36, y: 0.24 };      // lamp position, fractions of the stage
  var lampHeld = false;                 // true while the pointer is steering the lamp
  var raf = 0, lastTime = 0;
  var PITCH_CSS = 44;

  var STATUS = [
    { min: 100, text: "A door ding, the way the board reads it: the reflected lines pull toward the low spot." },
    { min: 60,  text: "Metal moving. The push comes from behind the panel, a fraction of a millimeter at a time, and the board is checked after every one." },
    { min: 20,  text: "Nearly there. The high ridge around the dent is tapped down while the low spot comes up." },
    { min: 1,   text: "Almost straight. The last passes are the finest ones." },
    { min: 0,   text: "Straight. The lines run true, and nothing was filled or repainted." }
  ];

  function statusFor(pct) {
    for (var i = 0; i < STATUS.length; i++) if (pct >= STATUS[i].min) return STATUS[i].text;
    return STATUS[STATUS.length - 1].text;
  }

  function layout() {
    // the stage is one small panel under the board: dent a little right of centre, lamp above left of it
    return {
      dent: [W * 0.58, H * 0.52],
      sigma: Math.max(28, Math.min(W, H) * 0.19),
      pitch: Math.max(16, Math.min(28, H / 11)),
      fade: null,
      bodyLine: 0
    };
  }

  function resize() {
    if (!gl) return;
    var rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    panel.resize(W, H, dpr);
    draw();
  }

  function draw() {
    if (!gl) return;
    var L = layout();
    if (!lampHeld) { lamp.x = lampDefault.x; lamp.y = lampDefault.y; }
    panel.render({
      depth: depth,
      dent: L.dent,
      sigma: L.sigma,
      lamp: [lamp.x * W, lamp.y * H],
      pitch: L.pitch,
      boardY: 0,
      bodyLine: L.bodyLine,
      fade: L.fade,
      exposure: 1.0
    });
  }

  function animate(now) {
    raf = 0;
    if (!lastTime) lastTime = now;
    var dt = Math.min(64, now - lastTime);
    lastTime = now;
    var diff = targetDepth - depth;
    if (reduceMotion.matches || Math.abs(diff) < 0.002) {
      depth = targetDepth;
      draw();
      lastTime = 0;
      return;
    }
    depth += diff * (1 - Math.exp(-dt / 120));
    draw();
    raf = window.requestAnimationFrame(animate);
  }

  function requestFrame() {
    if (!raf) raf = window.requestAnimationFrame(animate);
  }

  function setPush(pct, fromSlider) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    if (!fromSlider) slider.value = String(pct);
    var depthPct = 100 - pct;
    targetDepth = depthPct / 100;
    slider.style.setProperty("--fill", pct + "%");
    slider.setAttribute("aria-valuetext", depthPct === 0 ? "Panel flat" : "Dent at " + depthPct + "% depth");
    readout.textContent = depthPct === 0 ? "Flat" : (pct === 0 ? "Not pushed yet" : "Pushed " + pct + "%");
    status.textContent = statusFor(depthPct);
    requestFrame();
  }

  if (gl && slider) {
    slider.addEventListener("input", function () { setPush(parseFloat(slider.value), true); });

    // a tap on the panel is a push, the way the technician would do it
    stage.addEventListener("click", function () {
      var current = parseFloat(slider.value) || 0;
      if (current >= 100) return;
      setPush(current + 12);
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(stage);
    } else {
      window.addEventListener("resize", resize);
    }
    setPush(0);
    resize();
    // fonts settle the copy box after first paint; measure again once they land
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  }

  /* ------------------------------------------------------------------ */
  /* The lamp: follows the pointer over the hero and relights the dent    */
  /* ------------------------------------------------------------------ */

  var lightRaf = 0;
  function moveLight(e) {
    if (e.pointerType === "touch" || reduceMotion.matches) return;
    var hr = hero.getBoundingClientRect();
    var hx = Math.max(0, Math.min(1, (e.clientX - hr.left) / hr.width));
    var hy = Math.max(0, Math.min(1, (e.clientY - hr.top) / hr.height));
    var sr = stage.getBoundingClientRect();
    var inStage = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
    if (inStage) {
      lampHeld = true;
      lamp.x = (e.clientX - sr.left) / sr.width;
      lamp.y = (e.clientY - sr.top) / sr.height;
    } else if (lampHeld) {
      lampHeld = false;
    }
    if (!lightRaf) {
      lightRaf = window.requestAnimationFrame(function () {
        lightRaf = 0;
        hero.style.setProperty("--lx", (hx * 100).toFixed(2) + "%");
        hero.style.setProperty("--ly", (hy * 100).toFixed(2) + "%");
        if (gl && !raf) draw();
      });
    }
  }
  if (hero) hero.addEventListener("pointermove", moveLight, { passive: true });
  if (hero) hero.addEventListener("pointerleave", function () { lampHeld = false; hero.style.removeProperty("--lx"); hero.style.removeProperty("--ly"); if (gl && !raf) draw(); });

  /* ------------------------------------------------------------------ */
  /* The worksheet: reads back what to say on the phone                  */
  /* ------------------------------------------------------------------ */

  var form = document.getElementById("worksheet");
  var readback = document.getElementById("readback");
  var readbackStatus = document.getElementById("readback-status");
  var copyBtn = document.getElementById("copy-notes");
  var saveBtn = document.getElementById("save-notes");
  var STORE_KEY = "dentrepairpro.worksheet";

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el.length !== undefined && el.tagName === undefined) { // RadioNodeList
      return el.value || "";
    }
    return (el.value || "").trim();
  }

  function compose() {
    var vehicle = val("vehicle");
    var panel = val("panel");
    var size = val("size");
    var count = val("count");
    var paint = val("paint");
    var position = val("position");
    var notes = val("notes");

    var any = vehicle || panel || size || count || paint || position || notes;
    if (!any) return null;

    var lines = [];
    var first = "Hi John. I've got ";
    if (count === "hail, dozens or more") {
      first += "hail damage";
    } else {
      first += (count === "two to five dents" ? "a few dents" : (size ? "a dent " + size : "a dent"));
    }
    if (count === "two to five dents" && size) first += ", each " + size;
    if (panel && panel !== "Not sure") first += " on the " + panel.toLowerCase().replace(" (plastic)", "");
    if (count === "hail, dozens or more" && !panel) first += " across the car";
    first += vehicle ? " of my " + vehicle + "." : ".";
    lines.push(first);

    if (paint === "intact") lines.push("The paint over it is intact, no scratch or chip.");
    if (paint === "scratched") lines.push("The paint is lightly scratched.");
    if (paint === "cracked") lines.push("The paint is chipped or cracked.");

    if (position === "flat") lines.push("It sits on a flat or gently curved area of the panel.");
    if (position === "edge") lines.push("It sits on a body line, crease, or edge.");
    if (position === "unsure") lines.push("I'm not sure whether it sits on a body line.");

    if (notes) lines.push(notes);

    var hint;
    if (panel === "Bumper cover (plastic)") {
      hint = "Plastic bumper covers are generally not a PDR job, so expect that answer. Still worth the call: John can tell you what is.";
    } else if (paint === "cracked") {
      hint = "Chipped or cracked paint usually means a body shop rather than PDR. Call anyway, and expect a straight answer about which.";
    } else if (size === "bigger than a baseball" && position === "edge") {
      hint = "A large dent on a body line is a judgment call. The inspection decides.";
    } else if (paint === "intact" && (position === "flat" || !position)) {
      hint = "This reads like a good PDR candidate. The inspection under the board is what decides.";
    } else {
      hint = "The inspection decides. Describe the dent and the paint, and expect a straight answer.";
    }
    return { script: lines, hint: hint + " Two photos help when you meet: one straight on, one from a low angle so a reflection crosses the dent." };
  }

  function render() {
    if (!form || !readback) return;
    var made = compose();
    readback.innerHTML = "";
    if (!made) {
      var hint = document.createElement("span");
      hint.className = "hint";
      hint.textContent = "Fill in what you know and your notes for the call will write themselves here.";
      readback.appendChild(hint);
      copyBtn.disabled = true;
      saveBtn.disabled = true;
      return;
    }
    readback.textContent = made.script.join("\n\n");
    var aside = document.createElement("span");
    aside.className = "aside";
    aside.textContent = made.hint;
    readback.appendChild(aside);
    copyBtn.disabled = false;
    saveBtn.disabled = false;
  }

  function serialize() {
    var data = {};
    ["vehicle", "panel", "size", "count", "paint", "position", "notes"].forEach(function (n) { data[n] = val(n); });
    return data;
  }

  function restore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      Object.keys(data).forEach(function (n) {
        var el = form.elements[n];
        if (!el || !data[n]) return;
        if (el.length !== undefined && el.tagName === undefined) {
          for (var i = 0; i < el.length; i++) if (el[i].value === data[n]) el[i].checked = true;
        } else {
          el.value = data[n];
        }
      });
    } catch (e) { /* storage unavailable; the page still works */ }
  }

  function persist() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(serialize())); } catch (e) { /* ignore */ }
  }

  function say(msg) {
    readbackStatus.textContent = msg;
    window.clearTimeout(say.t);
    say.t = window.setTimeout(function () { readbackStatus.textContent = ""; }, 4000);
  }

  // the phone script, then the suitability note on its own lines
  function notesText() {
    var made = compose();
    if (!made) return "";
    return made.script.join("\n\n") + "\n\n" + made.hint;
  }

  if (form && readback) {
    readback.innerHTML = "";
    restore();
    render();
    form.addEventListener("input", function () { render(); persist(); });
    form.addEventListener("change", function () { render(); persist(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    copyBtn.addEventListener("click", function () {
      var text = notesText() + "\n\nDent Repair Pro, Lenexa KS. " + CALL_NUMBER;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say("Copied. Paste it into a text or read it on the call."); },
          function () { say("Copy was blocked by the browser. Select the text and copy it by hand."); });
      } else {
        var range = document.createRange();
        range.selectNodeContents(readback);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        sel.removeAllRanges();
        say(ok ? "Copied." : "Select the text and copy it by hand.");
      }
    });

    saveBtn.addEventListener("click", function () {
      var text = "Notes for Dent Repair Pro, " + CALL_NUMBER + "\n\n" + notesText() + "\n";
      var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "dent-notes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      say("Saved dent-notes.txt to your device.");
    });
  }

  /* ------------------------------------------------------------------ */
  /* The call bar: appears on small screens once the hero scrolls away   */
  /* ------------------------------------------------------------------ */

  var callbar = document.getElementById("callbar");
  var closing = document.getElementById("call");
  if (callbar && hero && closing && "IntersectionObserver" in window) {
    var heroGone = false, closingVisible = false;
    function update() {
      var show = heroGone && !closingVisible;
      callbar.classList.toggle("is-visible", show);
      callbar.setAttribute("aria-hidden", show ? "false" : "true");
      callbar.tabIndex = show ? 0 : -1;
      document.body.classList.toggle("has-callbar", show);
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        // the bar appears only once the whole hero, demo included, has scrolled past
        heroGone = !en.isIntersecting && en.boundingClientRect.bottom <= 0;
      });
      update();
    }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { closingVisible = en.isIntersecting; });
      update();
    }, { threshold: 0.2 }).observe(closing);
    update();
  }
})();
