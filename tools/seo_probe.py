#!/usr/bin/env python3
"""Deeper SEO probe of the live page: word count, keyword counts, link mix, headers, http->https."""
import re
import sys
import urllib.request

host = sys.argv[1] if len(sys.argv) > 1 else "dentrepairpro.patpadgett.com"
url = "https://" + host + "/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 seo-probe"})
with urllib.request.urlopen(req, timeout=20) as r:
    s = r.read().decode("utf-8", "replace")
    hdrs = {k.lower(): v for k, v in r.headers.items()}

body = re.sub(r"<script.*?</script>", "", s, flags=re.S)
body = re.sub(r"<style.*?</style>", "", body, flags=re.S)
text = re.sub(r"<[^>]+>", " ", body)
words = text.split()
tl = text.lower()
print("words", len(words))
for k in ["paintless dent repair", "pdr", "lenexa", "kansas city", "overland park", "olathe", "shawnee",
          "johnson county", "hail", "door ding", "dent repair", "crease", "body shop"]:
    print(" kw %-22s %d" % (k, tl.count(k)))
print("internal anchor links", len(re.findall(r'href="#', s)))
print("external links", re.findall(r'href="(https?://(?!dentrepairpro)[^"]+)"', s))
print("headers:", {k: hdrs.get(k) for k in ("content-type", "strict-transport-security", "cache-control", "server")})
m = re.search(r'<meta name="description" content="([^"]*)"', s)
print("description len", len(m.group(1)) if m else None, "::", m.group(1) if m else None)
print("twitter tags", re.findall(r'<meta name="twitter:[^"]+"', s))
print("icon links", re.findall(r'<link rel="[^"]*icon[^"]*"[^>]*>', s))
print("lang", re.search(r'<html[^>]*lang="([^"]*)"', s).group(1))
# http -> https
try:
    import http.client
    c = http.client.HTTPConnection(host, timeout=15)
    c.request("GET", "/")
    resp = c.getresponse()
    print("http://", resp.status, resp.getheader("Location"))
except Exception as e:
    print("http probe failed", e)
