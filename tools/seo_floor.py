#!/usr/bin/env python3
"""SEO floor pass for dentrepairpro.patpadgett.com: head meta, icon links, JSON-LD built from the page's
own FAQ DOM and the verified facts, 404 icon links, sitemap lastmod. Run from the repo root."""
import datetime
import html
import json
import re

SITE = "https://dentrepairpro.patpadgett.com"
PHONE_DIGITS = [43, 49, 56, 49, 54, 54, 57, 52, 54, 50, 56, 56]  # +18166946288 as code points (tool output masks digits)
PHONE = "".join(chr(c) for c in PHONE_DIGITS)
PHONE_PRETTY = "(816) 694-6288"

p = "index.html"
s = open(p, encoding="utf-8").read()

# --- description: 189 -> <=160 chars, keyword-led, phone kept ---------------------------------
old_desc = re.search(r'<meta name="description" content="([^"]*)">', s).group(0)
new_desc_text = ("Paintless dent repair in Lenexa, Kansas. Door dings, hail, and creases pushed out from behind "
                 "the panel, no filler, no repaint. Call John at " + PHONE_PRETTY + ".")
assert len(new_desc_text) <= 160, len(new_desc_text)
s = s.replace(old_desc, '<meta name="description" content="%s">' % html.escape(new_desc_text, quote=True))

# --- social: og extras + full twitter set + icon set (idempotent: skip when already present) ----
old_tw = '  <meta name="twitter:card" content="summary_large_image">\n  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">\n'
og_alt = "A door ding under a PDR line board: the reflected lines bend toward the low spot. Headline: The lines don't lie."
if old_tw in s:
    new_tw = (
    '  <meta property="og:image:alt" content="%s">\n' % html.escape(og_alt, quote=True) +
    '  <meta property="og:site_name" content="Dent Repair Pro">\n'
    '  <meta property="og:locale" content="en_US">\n'
    '  <meta name="twitter:card" content="summary_large_image">\n'
    '  <meta name="twitter:title" content="Dent Repair Pro — The lines don\'t lie.">\n'
    '  <meta name="twitter:description" content="Paintless dent repair in Lenexa, Kansas. The metal goes back without filler or repaint. Call %s.">\n' % PHONE_PRETTY +
    '  <meta name="twitter:image" content="%s/assets/og.png">\n' % SITE +
    '  <meta name="twitter:image:alt" content="%s">\n' % html.escape(og_alt, quote=True) +
    '  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">\n'
    '  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">\n'
    '  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">\n'
    '  <link rel="icon" href="/assets/icon-512.png" type="image/png" sizes="512x512">\n'
    )
    s = s.replace(old_tw, new_tw)

# --- JSON-LD: one @graph built with json.dumps from verified facts + the FAQ DOM -----------------
faqs = []
for m in re.finditer(r'<details>\s*<summary>(.*?)<svg.*?</summary>\s*<div class="answer">(.*?)</div>\s*</details>', s, flags=re.S):
    q = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    a = html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip()
    a = re.sub(r"\s+", " ", a).replace("\u2011", "-")
    faqs.append((q, a))
assert len(faqs) == 7, len(faqs)

business = {
    "@type": "AutoBodyShop",
    "@id": SITE + "/#business",
    "name": "Dent Repair Pro, LLC",
    "alternateName": "Dent Repair Pro",
    "description": "Paintless dent repair (PDR) in Lenexa, Kansas: door dings, hail, and creases pushed out from behind the panel with no filler and no repaint.",
    "url": SITE + "/",
    "telephone": PHONE,
    "image": SITE + "/assets/og.png",
    "logo": SITE + "/assets/icon-512.png",
    "address": {"@type": "PostalAddress", "addressLocality": "Lenexa", "addressRegion": "KS", "postalCode": "66215", "addressCountry": "US"},
    "founder": {"@type": "Person", "name": "John Matthews"},
    "knowsAbout": ["Paintless dent repair", "Door ding repair", "Hail damage repair"],
    "sameAs": ["https://napdrt.org/find-a-tech/"],
    "contactPoint": {"@type": "ContactPoint", "telephone": PHONE, "contactType": "customer service", "areaServed": "US", "availableLanguage": "English"},
}
website = {
    "@type": "WebSite",
    "@id": SITE + "/#website",
    "url": SITE + "/",
    "name": "Dent Repair Pro",
    "publisher": {"@id": SITE + "/#business"},
    "inLanguage": "en-US",
}
webpage = {
    "@type": "WebPage",
    "@id": SITE + "/#webpage",
    "url": SITE + "/",
    "name": "Dent Repair Pro — Paintless Dent Repair, Lenexa, Kansas",
    "description": new_desc_text,
    "isPartOf": {"@id": SITE + "/#website"},
    "about": {"@id": SITE + "/#business"},
    "primaryImageOfPage": {"@type": "ImageObject", "url": SITE + "/assets/og.png", "width": 1200, "height": 630},
    "inLanguage": "en-US",
}
faqpage = {
    "@type": "FAQPage",
    "@id": SITE + "/#faq",
    "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs],
}
graph = {"@context": "https://schema.org", "@graph": [business, website, webpage, faqpage]}
ld = json.dumps(graph, ensure_ascii=False, indent=2)
# a safety check against the harness masking "https://schema.org","@type" adjacency: pretty-printed JSON keeps them apart
assert '"@context": "https://schema.org"' in ld

old_ld = re.search(r'  <script type="application/ld\+json">.*?</script>\n', s, flags=re.S).group(0)
s = s.replace(old_ld, '  <script type="application/ld+json">\n%s\n  </script>\n' % ld)
open(p, "w", encoding="utf-8").write(s)

# --- 404: icon links (idempotent) --------------------------------------------------------------------
p4 = "404.html"
t = open(p4, encoding="utf-8").read()
old_icon = '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">\n'
if "apple-touch-icon" not in t:
    t = t.replace(old_icon, '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">\n<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">\n')
    open(p4, "w", encoding="utf-8").write(t)

# --- sitemap lastmod -------------------------------------------------------------------------------
sm = open("sitemap.xml", encoding="utf-8").read()
sm = re.sub(r"<lastmod>[^<]*</lastmod>", "<lastmod>%s</lastmod>" % datetime.date.today().isoformat(), sm)
open("sitemap.xml", "w", encoding="utf-8").write(sm)

# verify: every ld+json block parses, no masked residue, phone intact
s2 = open(p, encoding="utf-8").read()
for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s2, flags=re.S):
    json.loads(blk)
assert "***" not in s2
assert s2.count('tel:' + PHONE) == 8, s2.count('tel:' + PHONE)
print("ok: description %d chars, %d FAQ entries, json-ld parses, tel hrefs intact" % (len(new_desc_text), len(faqs)))
