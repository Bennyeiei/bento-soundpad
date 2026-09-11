# Voice Guide data contract

The public page is a static app. `data/jobs.json` is the current job catalog and `data/legacy-jobs.json` is a read-only compatibility catalog for the original `?cat=` links.

## Job

- `id`: canonical display code, uppercase (`KKT10`, `KKM17`); do not infer one code family from another.
- `slug`: lowercase URL key, unique across current jobs.
- `title`: user-facing title.
- `status`: `active` or `legacy`.
- `source`: provenance label only; do not put credentials or private URLs in public JSON.
- `sounds`: list of voice-guide items.

## Sound item

- `id`: unique within its job.
- `label`: visible card label.
- `pronunciation`: exact text sent to browser TTS; it is not silently rewritten from a filename.
- `aliases`: searchable names; aliases do not create extra audio items.
- `type`: `tts` or `file`.
- `tts.lang`: speech language, currently `th-TH`.
- `tts.rate`: item baseline rate; the speed slider scales it.
- `file`: a public repository path under `audio/`, or `null` for TTS-first items.
- `color`: optional pad color (`red`, `green`, `blue`, `pink`).

## URL contract

- Current job: `?job=kkt10`.
- Legacy job: `?cat=kkm17`.
- Search may be appended as `&q=...`.
- Job selection is presentation state, not an authorization mechanism.
- Never map `KKM`/`KKN`/other codes to `KKT` without an explicit verified mapping.
