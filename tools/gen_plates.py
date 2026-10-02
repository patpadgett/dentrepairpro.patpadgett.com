#!/usr/bin/env python3
"""Generate the hero plate candidates with the local ComfyUI (Flux Schnell FP8, img2img).

usage: python3 tools/gen_plates.py <ref.png> <outdir> <denoise> <seed> [<seed> ...]
Reads the prompt from tools/prompt-hero.txt and drives the skill's run_workflow.py.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RUN = "/data/pat/.hermes/skills/creative/comfyui/scripts/run_workflow.py"
WF = os.path.join(HERE, "flux_img2img.json")
PROMPT = open(os.path.join(HERE, "prompt-hero.txt")).read().strip()

ref, outdir, denoise = sys.argv[1], sys.argv[2], float(sys.argv[3])
seeds = [int(x) for x in sys.argv[4:]] or [7]
os.makedirs(outdir, exist_ok=True)

for seed in seeds:
    args = {"prompt": PROMPT, "seed": seed, "denoise": denoise, "steps": 4,
            "filename_prefix": "drp_panel_d%02d_s%d" % (round(denoise * 100), seed)}
    cmd = [sys.executable, RUN, "--workflow", WF, "--input-image", "image=" + ref,
           "--args", json.dumps(args), "--output-dir", outdir, "--timeout", "600"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    text = r.stdout
    try:
        out = json.loads(text[text.index("{"):])
        files = [o["file"] for o in out.get("outputs", [])]
        print("seed", seed, "denoise", denoise, out.get("status"), files, flush=True)
    except Exception:
        print("seed", seed, "FAILED", r.stdout[-400:], r.stderr[-800:], flush=True)
