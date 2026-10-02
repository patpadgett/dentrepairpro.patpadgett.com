#!/usr/bin/env python3
"""Generate the line-board SVG assets for dentrepairpro.patpadgett.com.

One displacement model drives every line on the site. A reflected line at
height y, read through a shallow dent centred at (cx, cy) with radius sigma,
pinches toward the dent centre:

    y' = y - (y - cy) * k * exp(-r^2 / sigma^2)

k is the dent depth (0 = flat panel, ~0.7 = a clear door ding). The lines
also carry the light: where the dented surface tilts toward the lamp the
reflected line brightens and thickens, where it tilts away it dims. That
slope-against-lamp shading is what makes the paint read as gloss rather than
as a diagram. script.js draws the hero canvas with the same model.

Run from the repo root:  python3 tools/make_svgs.py
"""
import math
import os

PANEL = "#15309A"
PANEL_DEEP = "#0B1B5E"
LINE = "#F2F5FF"
AMBER = "#FFB454"

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

LEVELS = 12          # alpha buckets for the shaded segments
ALPHA_MIN = 0.14
ALPHA_BASE = 0.82
GAIN = 5.0
LAMP = (-0.6, -0.8)  # direction from the dent toward the lamp (upper left)


def level_of(alpha):
    a = max(ALPHA_MIN, min(1.0, alpha))
    return int(round((a - ALPHA_MIN) / (1.0 - ALPHA_MIN) * (LEVELS - 1)))


def level_alpha(level):
    return ALPHA_MIN + (1.0 - ALPHA_MIN) * level / (LEVELS - 1)


def level_width(level, base_w):
    # the lit side thickens: from base to base * 2.4 across the levels above base
    a = level_alpha(level)
    t = max(0.0, (a - ALPHA_BASE) / (1.0 - ALPHA_BASE))
    return base_w * (1.0 + 1.4 * t * t)


def shaded_lines(w, h, cx, cy, sigma, k, spacing, base_w=1.6, lamp=LAMP, x0=0.0, x1=None):
    """Return {level: [path d strings]} for all lines across the panel."""
    x1 = w if x1 is None else x1
    lx, ly = lamp
    ll = math.hypot(lx, ly) or 1.0
    ux, uy = lx / ll, ly / ll
    s2 = sigma * sigma
    reach = sigma * 2.6
    D = k * sigma * 0.35
    base_level = level_of(ALPHA_BASE)
    out = {}

    def add(level, d):
        out.setdefault(level, []).append(d)

    # line positions: the dent centre sits midway between two lines
    j0 = int(math.floor((0 - cy) / spacing - 0.5)) - 1
    j1 = int(math.ceil((h - cy) / spacing - 0.5)) + 1
    for j in range(j0, j1 + 1):
        y = cy + (j + 0.5) * spacing
        if y < -spacing or y > h + spacing:
            continue
        dy = y - cy
        if k < 1e-6 or abs(dy) > reach:
            add(base_level, "M%.1f %.1f L%.1f %.1f" % (x0, y, x1, y))
            continue
        xa, xb = max(x0, cx - reach), min(x1, cx + reach)
        if xa > x0:
            add(base_level, "M%.1f %.1f L%.1f %.1f" % (x0, y, xa, y))
        if xb < x1:
            add(base_level, "M%.1f %.1f L%.1f %.1f" % (xb, y, x1, y))
        step = 3.0
        px, py = xa, y
        cur_level, cur = None, ""
        x = xa + step
        while x <= xb + 1e-6:
            dx = x - cx
            g = math.exp(-(dx * dx + dy * dy) / s2)
            yy = y - dy * k * g
            dhdx = D * 2.0 * dx / s2 * g
            dhdy = D * 2.0 * dy / s2 * g
            shade = -GAIN * (dhdx * ux + dhdy * uy)
            lvl = level_of(ALPHA_BASE + shade)
            if lvl != cur_level:
                if cur:
                    add(cur_level, cur)
                cur_level = lvl
                cur = "M%.1f %.2f" % (px, py)
            cur += " L%.1f %.2f" % (x, yy)
            px, py = x, yy
            x += step
        if cur:
            add(cur_level, cur)
    return out


def render_lines(buckets, base_w, stroke=LINE):
    parts = []
    for lvl in sorted(buckets):
        a = level_alpha(lvl)
        wdt = level_width(lvl, base_w)
        parts.append('<g fill="none" stroke="%s" stroke-opacity="%.2f" stroke-width="%.2f" stroke-linecap="round" stroke-linejoin="round">' % (stroke, a, wdt))
        for d in buckets[lvl]:
            parts.append('<path d="%s"/>' % d)
        parts.append("</g>")
    return "\n".join(parts)


def bowl(cx, cy, sigma, k, idn="bowl"):
    if k < 0.02:
        return "", ""
    strength = k / 0.72
    defs = ('<radialGradient id="%s" cx="%.1f" cy="%.1f" r="%.1f" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#000" stop-opacity="%.3f"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
            % (idn, cx, cy, sigma * 1.1, 0.07 * strength))
    return defs, '<rect width="100%%" height="100%%" fill="url(#%s)"/>' % idn


def panel_svg(w, h, cx, cy, sigma, k, spacing, base_w=1.6, bg=PANEL, rx=0, extra="", mask=None, par=None):
    defs, bowl_rect = bowl(cx, cy, sigma, k)
    buckets = shaded_lines(w, h, cx, cy, sigma, k, spacing, base_w)
    lines = render_lines(buckets, base_w)
    if mask:
        defs += mask[0]
        lines = '<g mask="url(#%s)">%s%s</g>' % (mask[1], bowl_rect, lines)
        bowl_rect = ""
    par_attr = (' preserveAspectRatio="%s"' % par) if par else ""
    return "\n".join([
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"%s role="img" aria-hidden="true" focusable="false">' % (w, h, w, h, par_attr),
        '<defs>%s</defs>' % defs,
        ('<rect width="%d" height="%d" rx="%d" fill="%s"/>' % (w, h, rx, bg)) if bg and bg != "none" else "",
        bowl_rect,
        lines,
        extra,
        "</svg>",
    ])


def write(name, svg):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(svg)
    print("wrote", path, len(svg), "bytes")


def mark(size=48):
    # the mark: a square plate of paint carrying lines, the middle ones pinched
    w = h = size
    cx, cy, sigma, k = w * 0.60, h * 0.50, w * 0.21, 0.66
    spacing = h / 5.0
    inset = size * 0.125
    buckets = shaded_lines(w, h, cx, cy, sigma, k, spacing, base_w=size * 0.045, x0=inset, x1=w - inset)
    return "\n".join([
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-hidden="true" focusable="false">' % (w, h, w, h),
        '<rect width="%d" height="%d" rx="%d" fill="%s"/>' % (w, h, max(2, size // 12), PANEL),
        render_lines(buckets, size * 0.045),
        "</svg>",
    ])


def reach_plate(w=320, h=200):
    """Cross-section: paint on metal with a dent, a rod coming up from behind."""
    cx, depth, sigma = 196.0, 30.0, 46.0

    def surf(y0):
        pts = []
        x = 0.0
        while x <= w + 1e-6:
            g = math.exp(-((x - cx) ** 2) / (sigma * sigma))
            pts.append((x, y0 + depth * g))
            x += 2.0
        return pts

    top = surf(78.0)
    bottom = surf(78.0 + 9.0)
    d_metal = "M%.1f %.1f" % top[0] + "".join(" L%.1f %.1f" % p for p in top[1:])
    d_metal += "".join(" L%.1f %.1f" % p for p in reversed(bottom)) + " Z"
    d_paint = "M%.1f %.1f" % top[0] + "".join(" L%.1f %.1f" % p for p in top[1:])
    tip_x, tip_y = cx - 2.0, 78.0 + 9.0 + depth - 1.0
    # the rod enters from outside the frame, bottom left, the way it enters a door
    rod = (f'<path d="M-16 236 L{tip_x-16:.1f} {tip_y+24:.1f}" stroke="{LINE}" stroke-width="6" stroke-linecap="round" fill="none"/>'
           f'<path d="M{tip_x-16:.1f} {tip_y+24:.1f} L{tip_x:.1f} {tip_y:.1f}" stroke="{LINE}" stroke-width="3.4" stroke-linecap="round" fill="none"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-hidden="true" focusable="false">'
        f'<rect width="{w}" height="{h}" fill="{PANEL}"/>'
        f'<linearGradient id="in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PANEL_DEEP}" stop-opacity="0"/><stop offset="1" stop-color="{PANEL_DEEP}" stop-opacity=".9"/></linearGradient>'
        f'<rect y="86" width="{w}" height="{h-86}" fill="url(#in)"/>'
        f'<path d="{d_metal}" fill="#8EA4E6" opacity=".55"/>'
        f'<path d="{d_paint}" fill="none" stroke="{LINE}" stroke-width="2.2" stroke-linecap="round"/>'
        f'{rod}'
        f'<circle cx="{tip_x:.1f}" cy="{tip_y-3:.1f}" r="7" fill="{AMBER}" opacity=".85"/>'
        f'</svg>'
    )


def straight_tile(spacing=44, w=8):
    """A one-line tile, repeated vertically by CSS for the closing field."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {spacing}" width="{w}" height="{spacing}" aria-hidden="true" focusable="false">'
            f'<path d="M0 {spacing/2:.1f} H{w}" stroke="{LINE}" stroke-opacity="0.92" stroke-width="1.6"/></svg>')


def photo_guides():
    """Two small diagrams for the worksheet: straight-on, and low with a reflection."""
    straight = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80" role="img" aria-hidden="true" focusable="false">'
        '<rect x="8" y="14" width="104" height="52" rx="2" fill="none" stroke="#F2F5FF" stroke-width="1.5"/>'
        '<path d="M8 27 H112 M8 40 H112 M8 53 H112" stroke="#F2F5FF" stroke-opacity=".55" stroke-width="1.2"/>'
        '<circle cx="66" cy="40" r="9" fill="none" stroke="#FFB454" stroke-width="1.6"/>'
        '<path d="M60 4 h12 M66 4 v10" stroke="#F2F5FF" stroke-width="1.5" stroke-linecap="round"/>'
        '</svg>')
    low = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80" role="img" aria-hidden="true" focusable="false">'
        '<path d="M8 66 L30 14 L112 14 L90 66 Z" fill="none" stroke="#F2F5FF" stroke-width="1.5" stroke-linejoin="round"/>'
        '<path d="M22 40 L104 40" stroke="#F2F5FF" stroke-opacity=".55" stroke-width="1.2"/>'
        '<path d="M14 53 L40 53 Q52 53 58 49 Q64 45 76 45 L96 45" stroke="#F2F5FF" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
        '<circle cx="60" cy="47" r="7" fill="none" stroke="#FFB454" stroke-width="1.6"/>'
        '<path d="M4 72 L18 68" stroke="#F2F5FF" stroke-width="1.5" stroke-linecap="round"/>'
        '</svg>')
    return straight, low


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write("mark.svg", mark(48))
    write("favicon.svg", mark(64))
    write("plate-reach.svg", reach_plate())
    write("lines-tile.svg", straight_tile())
    s, l = photo_guides()
    write("photo-straight.svg", s)
    write("photo-low.svg", l)
    # the hero fallback, the reflected-board process plates and the social card are rasters now,
    # rendered from panel.js (the site's own WebGL program) by tools/render.js and tools/og.js;
    # the vector predecessors are removed if they linger
    for f in ("board-straight.svg", "board-dented.svg", "plate-read.svg", "plate-push.svg", "plate-straight.svg"):
        p = os.path.join(OUT, f)
        if os.path.exists(p):
            os.remove(p)
            print("removed", p)
