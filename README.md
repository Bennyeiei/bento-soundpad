# KKT Voice Guide

Static, single-page voice guide derived from the original Bubble Voice layout.

## User-facing URLs

- All jobs: `https://bennyeiei.github.io/bento-soundpad/`
- A job by code: `https://bennyeiei.github.io/bento-soundpad/?job=kkt10`
- KKT13 glossary job: `https://bennyeiei.github.io/bento-soundpad/?job=kkt13`
- KKT12 glossary job: `https://bennyeiei.github.io/bento-soundpad/?job=kkt12`
- Legacy compatibility: `https://bennyeiei.github.io/bento-soundpad/?cat=kkm17`

The sidebar keeps the original one-page behavior: selecting a job swaps the visible cards and updates the URL without leaving the page. The job-code link in the header can be copied or shared directly.

## Current data

- `data/glossary.json`: central, append-only candidate glossary for clean Thai terms from KKT01-KKT13 SRT files. Exact spelling variants remain separate. The `reviewQueue` is collected for later confirmation but is not shown as a sound card.
- `data/jobs.json`: current job catalog. Each job uses `glossaryRefs` to pull only its central terms. KKT10 retains its confirmed inline `ไกด์เสียง` cards; KKT12 retains its supplied `Chinese-Thai Drama Glossary · KKT12_01` cards and is not copied into the central file.
- `data/kkt12-job.json`: source-shaped KKT12 glossary seed with 62 clean character, title, kinship, place, event, object, drug, and terminology entries. Alternate names are separate cards; display-only age/role notes stay in `note`, and easy generic `ฮ่องเต้`/`ฝ่าบาท` plus `สาวใช้โม่หลาน` are not cards.
- `data/legacy-jobs.json`: read-only projection of the original `sounds.json` categories.
- `sounds.json`: retained as the original compatibility source and snapshot evidence.
- `data/schema.md`: field, central-glossary, and URL contract.

Central glossary audio is stored once under `audio/glossary/` and is reused by every job that references the term. Job-specific audio remains under `audio/<job-slug>/`. Browser TTS remains a fallback only when a file cannot play and the browser has an actual speech voice. The app reports when no speech voice exists instead of claiming silent TTS succeeded.

## Adding terms to the central glossary

1. Add a clean entry to `data/glossary.json` with a stable `id`, exact Thai `label`, reviewed `pronunciation`, `sourceJobs`, and `occurrencesInSrt`.
2. Keep exact spelling variants as separate entries; do not invent Chinese aliases. Do not put slash, brackets, parentheses, metadata, or generic titles in a sound entry.
3. Add the entry ID to the relevant job's `glossaryRefs` in `data/jobs.json`. Do not copy the full sound object into the job.
4. Put uncertain candidates in `reviewQueue` until the wording and role are confirmed.
5. Rebuild central MP3s with the development helper, then run validation and tests.

```bash
python scripts/generate_tts_audio.py
npm test
npm run validate
```

## Local verification

Serve the repository through HTTP (ES modules and service workers do not work reliably from `file://`):

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/?job=kkt10`, `http://127.0.0.1:4173/?job=kkt12`, or `http://127.0.0.1:4173/?job=kkt13`. For another device on the same LAN, use the host's LAN address instead of `127.0.0.1`.

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
