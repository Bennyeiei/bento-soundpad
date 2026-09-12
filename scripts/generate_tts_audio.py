#!/usr/bin/env python3
"""Generate local MP3 guide clips for active jobs using Microsoft Edge TTS.

This is a build-time helper; the deployed page only serves the generated files.
It intentionally reads the catalog pronunciation field instead of inventing text.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "jobs.json"
GLOSSARY_PATH = ROOT / "data" / "glossary.json"
VOICE = "th-TH-PremwadeeNeural"


async def generate_one(sound: dict, output: Path, *, force: bool) -> str:
    if output.exists() and output.stat().st_size > 0 and not force:
        return "kept"
    output.parent.mkdir(parents=True, exist_ok=True)
    text = str(sound.get("pronunciation") or sound.get("label") or "").strip()
    if not text:
        raise ValueError(f"missing pronunciation for {sound.get('id')}")
    await edge_tts.Communicate(text, VOICE).save(str(output))
    if not output.exists() or output.stat().st_size == 0:
        raise RuntimeError(f"empty audio output for {sound.get('id')}")
    return "generated"


async def main(force: bool) -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    generated = 0
    kept = 0
    for job in catalog.get("jobs", []):
        if job.get("status") != "active":
            continue
        for sound in job.get("sounds", []):
            relative = Path("audio") / str(job["slug"]) / f"{sound['id']}.mp3"
            result = await generate_one(sound, ROOT / relative, force=force)
            if result == "generated":
                generated += 1
            else:
                kept += 1
            sound["file"] = relative.as_posix()
            sound["type"] = "file"
    for term in glossary.get("terms", []):
        relative = Path("audio") / "glossary" / f"{term['id']}.mp3"
        result = await generate_one(term, ROOT / relative, force=force)
        if result == "generated":
            generated += 1
        else:
            kept += 1
        term["file"] = relative.as_posix()
        term["type"] = "file"
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    GLOSSARY_PATH.write_text(json.dumps(glossary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"audio generation passed: generated={generated}, kept={kept}, glossary_terms={len(glossary.get('terms', []))}, voice={VOICE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="regenerate existing clips")
    args = parser.parse_args()
    asyncio.run(main(args.force))
