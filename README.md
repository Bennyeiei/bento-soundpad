# KKT Voice Guide

Static, single-page voice guide derived from the original Bubble Voice layout.

## User-facing URLs

- All jobs: `https://bennyeiei.github.io/bento-soundpad/`
- A job by code: `https://bennyeiei.github.io/bento-soundpad/?job=kkt10`
- Legacy compatibility: `https://bennyeiei.github.io/bento-soundpad/?cat=kkm17`

The sidebar keeps the original one-page behavior: selecting a job swaps the visible cards and updates the URL without leaving the page. The job-code link in the header can be copied or shared directly.

## Current data

- `data/jobs.json`: current job catalog; KKT10 is seeded from the confirmed `ไกด์เสียง` values in the public KKT10 sheet export.
- `data/legacy-jobs.json`: read-only projection of the original `sounds.json` categories.
- `sounds.json`: retained as the original compatibility source and snapshot evidence.
- `data/schema.md`: field and URL contract.

The public data contains no tokens or private authentication material. TTS items use browser `speechSynthesis`; a valid public `file` takes priority and falls back to TTS if it cannot play.

## Local verification

Serve the repository through HTTP (ES modules and service workers do not work reliably from `file://`):

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/?job=kkt10`.

Run the deterministic checks:

```bash
npm test
npm run validate
```

## Rollback boundary

The redesign is on branch `redesign/kkt-voice-guide`. The pre-change commit is recorded in `docs/legacy/baseline-commit.txt`; source snapshots and SHA-256 manifests are under `docs/legacy/` and in the local backup directory recorded during implementation. Do not delete legacy audio until a separate migration manifest and explicit approval exist.
