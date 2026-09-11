# KKT Voice Guide

Static, single-page voice guide derived from the original Bubble Voice layout.

## User-facing URLs

- All jobs: `https://bennyeiei.github.io/bento-soundpad/`
- A job by code: `https://bennyeiei.github.io/bento-soundpad/?job=kkt10`
- KKT12 glossary job: `https://bennyeiei.github.io/bento-soundpad/?job=kkt12`
- Legacy compatibility: `https://bennyeiei.github.io/bento-soundpad/?cat=kkm17`

The sidebar keeps the original one-page behavior: selecting a job swaps the visible cards and updates the URL without leaving the page. The job-code link in the header can be copied or shared directly.

## Current data

- `data/jobs.json`: current job catalog; KKT10 comes from the confirmed `ไกด์เสียง` values in the public KKT10 sheet export, and KKT12 comes from the supplied `Chinese-Thai Drama Glossary · KKT12_01`.
- `data/kkt12-job.json`: source-shaped KKT12 glossary seed with 49 character, title, kinship, place, event, object, drug, and terminology entries.
- `data/legacy-jobs.json`: read-only projection of the original `sounds.json` categories.
- `sounds.json`: retained as the original compatibility source and snapshot evidence.
- `data/schema.md`: field and URL contract.

The current KKT10 and KKT12 catalogs use generated public MP3 files under `audio/`; browser TTS remains a fallback only when a file cannot play and the browser has an actual speech voice. The app reports when no speech voice exists instead of claiming silent TTS succeeded.

## Local verification

Serve the repository through HTTP (ES modules and service workers do not work reliably from `file://`):

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/?job=kkt10` or `http://127.0.0.1:4173/?job=kkt12`. For another device on the same LAN, use the host's LAN address instead of `127.0.0.1`.

Generated MP3 files can be rebuilt from the catalog with the development-only helper:

```bash
python -m pip install -r requirements-dev.txt
python scripts/generate_tts_audio.py
```

Run the deterministic checks:

```bash
npm test
npm run validate
```

## Rollback boundary

The redesign is on branch `redesign/kkt-voice-guide`. The pre-change commit is recorded in `docs/legacy/baseline-commit.txt`; source snapshots and SHA-256 manifests are under `docs/legacy/` and in the local backup directory recorded during implementation. Do not delete legacy audio until a separate migration manifest and explicit approval exist.
