# Legacy snapshot before KKT redesign

- Repository: `Bennyeiei/bento-soundpad`
- Baseline commit: `b423263a19f090b7b77d1d1d077b84dfad154512`
- Baseline branch: `main`
- Redesign branch: `redesign/kkt-voice-guide`
- Snapshot time: `2026-09-11T08:45:23Z`
- Runtime entrypoint: `index.html`
- Deployment shape: static GitHub Pages at repository root

## Preserved legacy scope

- `sounds.json` is copied as `sounds-v1.json` and remains the source snapshot for the old UI.
- Existing `?cat=kkm15` and `?cat=kkm17` records are preserved as legacy IDs. They are not inferred to be KKT jobs.
- Existing audio paths under `audio/kkm15/` and `audio/kkm17/` are retained; no audio files were renamed or deleted.
- `index.html`, `sounds.json`, `sw.js`, and `manifest.webmanifest` were copied unchanged into this directory before redesign work.

See `sha256-before-redesign.txt` for the verified file hashes and `audio-files.txt` for the tracked audio inventory.
