#!/usr/bin/env python3
"""Text-to-image hero candidates with the local ComfyUI (Flux Schnell FP8).

usage: python3 tools/gen_t2i.py <outdir> <promptfile> <seed> [<seed> ...]
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RUN = "/data/pat/.hermes/skills/creative/comfyui/scripts/run_workflow.py"
WF = os.path.join(HERE, "flux_txt2img.json")

outdir, promptfile = sys.argv[1], sys.argv[2]
PROMPT = open(promptfile).read().strip()
seeds = [int(x) for x in sys.argv[3:]] or [7]
os.makedirs(outdir, exist_ok=True)
tag = os.path.splitext(os.path.basename(promptfile))[0]

for seed in seeds:
    args = {"prompt": PROMPT, "seed": seed, "steps": 4, "filename_prefix": "drp_%s_s%d" % (tag, seed)}
    cmd = [sys.executable, RUN, "--workflow", WF, "--args", json.dumps(args), "--output-dir", outdir, "--timeout", "600"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    text = r.stdout
    try:
        out = json.loads(text[text.index("{"):])
        print("seed", seed, out.get("status"), [o["file"] for o in out.get("outputs", [])], flush=True)
    except Exception:
        print("seed", seed, "FAILED", r.stdout[-400:], r.stderr[-800:], flush=True)
