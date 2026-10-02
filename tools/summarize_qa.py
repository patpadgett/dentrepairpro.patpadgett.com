#!/usr/bin/env python3
"""Summarise tools/qa.js JSON output (read from a file) in a few lines."""
import json
import sys

raw = open(sys.argv[1]).read()
try:
    d = json.loads(raw)
except Exception:
    print(raw[:3000])
    sys.exit(1)

KEYS = ['overflow', 'wide', 'ctaInViewport', 'ctaRect', 'board', 'copy', 'controls', 'heroH',
        'canvasShown', 'staticShown', 'errors', 'failed', 'valueText', 'afterFull', 'readout',
        'canvasChanged', 'checked', 'copyDisabled', 'dlName', 'faqOpen', 'callbarVisible', 'callbarAtTop', 'callbar']
for k, v in d.items():
    if k == 'nojs':
        print('nojs', v)
        continue
    print(k, {x: v.get(x) for x in KEYS})
    print('   h1:', v['h1']['size'], v['h1']['lh'])
