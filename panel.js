/* Dent Repair Pro — panel.js
   A painted steel panel under a PDR line board, rendered in WebGL.

   The surface is a height field: a door skin crowned along its height, a pressed
   body line, a dent, and orange peel. The fragment shader mirrors the view ray
   off that surface onto a finite line board (a white face with dark stripes, lit
   hardest under its lamp), draws the white bands through the clear coat with the
   paint showing between them, reflects a dark room beyond the board's edges, and
   shades the pigment underneath. Everything the visitor sees in the hero, the no-JS fallback, the
   process plates and the social card comes from this one program.

   Exposed as window.DRPPanel = { create(canvas, opts) -> handle }
     handle.render(params)   params: { depth 0..1, dent [x,y] px, sigma px, lamp [x,y] px,
                                       pitch px, boardY px, bodyLine px|0, fade [x0,x1,yTop,yBottom]|null,
                                       exposure }
     handle.resize(w, h, dpr)
     handle.gl                the context (null when WebGL is unavailable)
*/
(function (global) {
  "use strict";

  var VERT = [
    "attribute vec2 a;",
    "varying vec2 vUv;",
    "void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform vec2 uRes;",        // canvas size in device px
    "uniform float uScale;",     // device px per CSS px
    "uniform float uDepth;",     // 0 flat .. 1 full dent
    "uniform vec2 uDent;",       // dent centre, device px (y up)
    "uniform float uSigma;",     // dent radius, device px
    "uniform vec2 uLamp;",       // lamp position on the board plane, device px (y up)
    "uniform float uBoardY;",    // stripe phase, device px
    "uniform float uPitch;",     // stripe pitch, device px
    "uniform float uBodyLine;",  // y of the body line, device px (<0 to disable)
    "uniform vec4 uFade;",       // x0 x1 (board left edge fade), yLow yHigh (board top/bottom), device px
    "uniform float uFadeOn;",
    "uniform vec3 uPaint;",
    "uniform vec3 uPaintDeep;",
    "uniform float uExposure;",
    "uniform float uMode;",       // 0 picture, 1 mask (R bars, G lamp weight, B dent shading 0.5 neutral)
    "",
    "const float BOARD_DIST = 300.0;",   // CSS px from the paint to the board plane
    "const float PULL = 0.72;",          // how hard the dent draws the reflected board toward its low spot (<1: no fold)
    "",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }",
    "",
    // the smooth skin: crown, body line, orange peel (device px of height)
    "float skin(vec2 p){",
    "  float yc = (p.y - uRes.y * 0.5) / max(uRes.y, 1.0);",
    "  float crown = -yc * yc * uRes.y * 0.025;",
    "  float line = 0.0;",
    "  if (uBodyLine > 0.0) { float t = (p.y - uBodyLine) / (14.0 * uScale); line = 2.6 * uScale * exp(-t*t) * (0.35 + 0.65 * smoothstep(-1.2, 0.3, t)) - 1.2 * uScale * smoothstep(-0.8, 0.8, t); }",
    "  float peel = (noise(p * (0.0075 / uScale)) - 0.5) * 0.30 * uScale + (noise(p * (0.016 / uScale) + 7.0) - 0.5) * 0.12 * uScale;",
    "  return crown + line + peel;",
    "}",
    // the dent itself, a concave bowl with a soft shoulder, used for the paint's own shading
    "float bowl(vec2 p){",
    "  vec2 d = p - uDent;",
    "  float r2 = dot(d, d) / (uSigma * uSigma);",
    "  float r = sqrt(r2);",
    "  float sh = (r - 1.4) / 0.6;",
    "  return (-exp(-r2) + 0.18 * exp(-sh * sh)) * uDepth * uSigma * 0.09;",
    "}",
    "",
    "void main(){",
    "  vec2 p = vUv * uRes;",
    "  float D = BOARD_DIST * uScale;",
    "  float e = 2.0 * uScale;",
    // normals: the smooth skin alone carries the reflection of the room and the board's gentle wander;
    // the bowl is added for the paint's diffuse shading
    "  float sx = (skin(p + vec2(e, 0.0)) - skin(p - vec2(e, 0.0))) / (2.0 * e);",
    "  float sy = (skin(p + vec2(0.0, e)) - skin(p - vec2(0.0, e))) / (2.0 * e);",
    "  float bx = (bowl(p + vec2(e, 0.0)) - bowl(p - vec2(e, 0.0))) / (2.0 * e);",
    "  float by = (bowl(p + vec2(0.0, e)) - bowl(p - vec2(0.0, e))) / (2.0 * e);",
    "  vec3 nSkin = normalize(vec3(-sx, -sy, 1.0));",
    "  vec3 n = normalize(vec3(-sx - bx, -sy - by, 1.0));",
    "",
    // viewer straight ahead; the clear coat reflects the view ray onto the board plane
    "  vec3 v = vec3(0.0, 0.0, 1.0);",
    "  vec3 r = reflect(-v, nSkin);",
    "  vec2 hit = p + r.xy / max(r.z, 0.2) * D;",
    // the dent draws the reflected board toward its low spot: a screen point near the dent shows a board
    // point further out, so the reflected lines converge and bunch into the dent
    "  vec2 dd = p - uDent;",
    // a real ding is never a perfect circle: this one is a little wider than tall and leans with the hit
    "  mat2 tilt = mat2(0.96, 0.28, -0.28, 0.96);",
    "  vec2 de = tilt * dd; de.x *= 0.82;",
    "  float rr = length(de) / uSigma;",
    // monotonic radial pull: the mapping r -> r / (1 - PULL*depth*g(r)) must keep increasing with r, which
    // a smooth bell with a soft floor guarantees; no fold, so the reflection never loops back on itself
    "  float g = exp(-pow(rr, 2.2) * 0.8);",
    "  hit = uDent + (hit - uDent) / (1.0 - PULL * uDepth * g);",
    "",
    // how much the reflection is squeezed here: board px per screen px
    "  float s = (hit.y - uBoardY) / uPitch;",
    "  float fw = max(fwidth(s), 0.00005);",
    "  float squeeze = fw * uPitch;",
    "  float defocus = smoothstep(2.2, 7.0, squeeze);",
    "",
    // the board: thin light tubes on a dark matte face; each reflected tube has a bright core and a soft bloom
    "  float dpx = abs(fract(s) - 0.5) * uPitch;",
    "  float coreW = sqrt(pow(1.25 * uScale, 2.0) + pow(squeeze * 0.6, 2.0));",
    "  float core = exp(-(dpx * dpx) / (coreW * coreW) * 1.3);",
    "  float halo = exp(-(dpx * dpx) / (coreW * coreW * 16.0)) * 0.22;",
    "  float tubes = mix(core + halo, 0.14, max(defocus, 0.35 * g * uDepth));",
    "",
    // the board is finite: beyond its edges the paint reflects the room
    "  float boardMask = 1.0;",
    "  if (uFadeOn > 0.5) {",
    "    boardMask *= smoothstep(uFade.x, uFade.y, p.x);",
    "    boardMask *= smoothstep(uFade.z - 50.0 * uScale, uFade.z, p.y) * (1.0 - smoothstep(uFade.w, uFade.w + 60.0 * uScale, p.y));",
    "  }",
    "",
    // the room, reflected through the same geometry: bright overhead, dark toward the floor
    "  float envT = clamp(hit.y / max(uRes.y, 1.0), 0.0, 1.0);",
    "  vec3 room = mix(vec3(0.02, 0.03, 0.09), vec3(0.78, 0.82, 0.94), pow(smoothstep(0.0, 1.0, envT), 1.4));",
    "",
    // the lamp: a warm disk mounted on the board, reflected through the same geometry as the tubes
    "  vec2 toLamp = hit - uLamp;",
    "  float lampR = 110.0 * uScale;",
    "  float lampDisk = exp(-dot(toLamp, toLamp) / (lampR * lampR));",
    "  float lampGlow = exp(-dot(toLamp, toLamp) / (lampR * lampR * 12.0));",
    "",
    // the paint's own shading under that lamp
    "  vec3 lampPos = vec3(uLamp, D * 1.6);",
    "  vec3 l = normalize(lampPos - vec3(p, 0.0));",
    "  float ndl = max(dot(n, l), 0.0);",
    "  float dist = length(uLamp - p) / uRes.x;",
    "  float falloff = 1.0 / (1.0 + 1.8 * dist * dist);",
    "  float shade = 0.40 + 0.60 * ndl * falloff;",
    "  vec3 paint = mix(uPaintDeep, uPaint, shade);",
    "  paint += vec3(0.012, 0.016, 0.03) * (noise(p * (0.05 / uScale)) - 0.5);",
    "  paint *= 1.0 - 0.20 * g * uDepth;",
    "  vec2 lampDir = normalize(uLamp - uDent + vec2(0.0001));",
    "  float facing = dot(normalize(de + vec2(0.0001)), tilt * lampDir);",
    "  paint += vec3(0.30, 0.34, 0.46) * exp(-pow((rr - 1.0) / 0.18, 2.0)) * max(facing, 0.0) * 0.55 * uDepth;",   // lit shoulder
    "  paint *= 1.0 - 0.35 * exp(-pow((rr - 0.78) / 0.22, 2.0)) * max(-facing, 0.0) * uDepth;",                     // shadowed wall
    "",
    // compose: pigment under a clear coat. The coat reflects ~10% of the room, and saturates on the lamp and tubes
    "  float fres = pow(1.0 - max(dot(n, v), 0.0), 5.0);",
    "  float F = 0.16 + 0.5 * fres;",
    "  vec3 col = paint * (1.0 - F) + room * F;",
    "  col = mix(col, vec3(0.93, 0.95, 1.0), clamp(tubes, 0.0, 1.0) * boardMask * 0.92 * (0.6 + 0.4 * ndl));",
    "  col = mix(col, vec3(1.0, 0.72, 0.36), clamp(lampDisk * 0.95, 0.0, 1.0));",
    "  col += vec3(1.0, 0.70, 0.36) * lampGlow * 0.22;",
    "  if (uMode > 0.5) {",
    "    float f = fract(s);",
    "    float fwS = max(fwidth(s), 0.0005);",
    "    float fwE = max(fwS * 1.6, 0.03);",
    "    float lo = f - fwE * 0.5, hi = f + fwE * 0.5;",
    "    float cov = max(0.0, min(hi, 0.58) - max(lo, 0.0)) + max(0.0, min(hi - 1.0, 0.58));",
    "    float band = clamp(cov / fwE, 0.0, 1.0);",
    "    band = mix(band, 0.30, smoothstep(0.4, 1.4, fwS));",
    "    band = mix(band, 0.30, 0.5 * g * uDepth);",
    "    float lampWm = exp(-dot(toLamp, toLamp) / (lampR * lampR * 7.0));",
    "    float rimLit = exp(-pow((rr - 1.0) / 0.16, 2.0)) * max(facing, 0.0) * uDepth;",
    "    float wall = exp(-pow((rr - 0.78) / 0.22, 2.0)) * max(-facing, 0.0) * uDepth;",
    "    gl_FragColor = vec4(band, lampWm, clamp(0.5 + 0.5 * rimLit - 0.5 * wall, 0.0, 1.0), 1.0);",
    "    return;",
    "  }",
    "  col *= uExposure;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error("shader: " + log);
    }
    return sh;
  }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function create(canvas, opts) {
    opts = opts || {};
    var gl = null;
    try {
      var attrs = { antialias: true, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve, powerPreference: "low-power" };
      gl = canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs);
    } catch (e) { gl = null; }
    if (!gl) return { gl: null, render: function () {}, resize: function () {} };
    gl.getExtension("OES_standard_derivatives");

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ["uRes", "uScale", "uDepth", "uDent", "uSigma", "uLamp", "uBoardY", "uPitch", "uBodyLine", "uFade", "uFadeOn", "uPaint", "uPaintDeep", "uExposure", "uMode"]
      .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    var paint = hexToRgb(opts.paint || "#1A3BB4");
    var paintDeep = hexToRgb(opts.paintDeep || "#0B1B5E");
    var W = 1, H = 1, dpr = 1;

    function resize(w, h, ratio) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h)); dpr = ratio || 1;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render(p) {
      // geometry arrives in CSS px with y down; the shader works in device px with y up
      var s = dpr;
      gl.uniform2f(U.uRes, W * s, H * s);
      gl.uniform1f(U.uScale, s);
      gl.uniform1f(U.uDepth, p.depth);
      gl.uniform2f(U.uDent, p.dent[0] * s, (H - p.dent[1]) * s);
      gl.uniform1f(U.uSigma, p.sigma * s);
      gl.uniform2f(U.uLamp, p.lamp[0] * s, (H - p.lamp[1]) * s);
      gl.uniform1f(U.uBoardY, (p.boardY || 0) * s);
      gl.uniform1f(U.uPitch, p.pitch * s);
      gl.uniform1f(U.uBodyLine, p.bodyLine > 0 ? (H - p.bodyLine) * s : -1.0);
      if (p.fade) {
        // fade: [x0, x1, yTop, yBottom] in CSS px, y measured from the top
        gl.uniform4f(U.uFade, p.fade[0] * s, p.fade[1] * s, (H - p.fade[3]) * s, (H - p.fade[2]) * s);
        gl.uniform1f(U.uFadeOn, 1.0);
      } else {
        gl.uniform4f(U.uFade, 0, 0, 0, 0);
        gl.uniform1f(U.uFadeOn, 0.0);
      }
      gl.uniform3f(U.uPaint, paint[0], paint[1], paint[2]);
      gl.uniform3f(U.uPaintDeep, paintDeep[0], paintDeep[1], paintDeep[2]);
      gl.uniform1f(U.uExposure, p.exposure || 1.0);
      gl.uniform1f(U.uMode, p.mode || 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { gl: gl, render: render, resize: resize };
  }

  global.DRPPanel = { create: create };
})(typeof window !== "undefined" ? window : this);
