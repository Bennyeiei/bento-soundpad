# Voice Guide data contract

The public page is a static app. `data/jobs.json` is the current job catalog, `data/glossary.json` is the central clean-term catalog, and `data/legacy-jobs.json` is a read-only compatibility catalog for the original `?cat=` links.

## Job

- `id`: canonical display code, uppercase (`KKT10`, `KKM17`); do not infer one code family from another.
- `slug`: lowercase URL key, unique across current jobs.
- `title`: user-facing title.
- `status`: `active` or `legacy`.
- `source`: provenance label only; do not put credentials or private URLs in public JSON.
- `sounds`: optional inline list of voice-guide items. Keep this for confirmed job-specific cards and compatibility data.
- `glossaryRefs`: optional ordered list of IDs from `data/glossary.json`. The app resolves these into sound items for this job; do not copy the full central sound object into a job.

The resolved list keeps inline sounds first, then appends referenced central terms. A central term whose visible label is already present as an inline card after whitespace normalization is not shown twice. Different spellings, such as `กู้เจวี้ยนเฉิน` and `กู้เจวียนเฉิน`, remain separate.

## Central glossary

`data/glossary.json` contains:

- `version`: integer schema version.
- `terms`: clean sound entries shared across jobs.
- `reviewQueue`: uncertain candidates collected for later confirmation; these are not resolved into job cards.
- `policy`: collection rules and the KKT12 provenance boundary.

Each central term has:

- `id`: stable `glossary-<kind>-<12 hex characters>` ID.
- `label`: exact visible Thai form.
- `pronunciation`: exact text sent to TTS or used to build the MP3; update only after review.
- `aliases`: searchable forms; aliases do not create extra audio items.
- `type`: `tts` or `file`.
- `file`: a shared public repository path under `audio/glossary/`, or `null` for TTS-first items.
- `kind`: `name`, `place`, or `specific-term`.
- `priority`: positive integer; `1` is the first-review group.
- `status`: `candidate` until the owner confirms the entry.
- `sourceJobs`: KKT codes where the exact term was found.
- `occurrencesInSrt`: per-job occurrence counts from the Thai source SRT.

Central entries must not contain slash, brackets, parentheses, metadata, or generic titles. Do not invent Chinese aliases when the source file does not verify them. Exact spelling variants are separate entries; exact duplicate terms across jobs are one entry with multiple `sourceJobs` values.

## Sound item

- `id`: unique within its job; central IDs are globally stable.
- `label`: visible card label.
- `pronunciation`: exact text sent to browser TTS; it is not silently rewritten from a filename.
- `aliases`: searchable names; aliases do not create extra audio items.
- `type`: `tts` or `file`.
- `tts.lang`: speech language, currently `th-TH`.
- `tts.rate`: item baseline rate; the speed slider scales it.
- `file`: a public repository path under `audio/`, or `null` for TTS-first items.
- `color`: optional pad color (`red`, `green`, `blue`, `pink`).

## URL contract

- Current job: `?job=kkt10` or `?job=kkt13`.
- Legacy job: `?cat=kkm17`.
- Search may be appended as `&q=...`.
- Job selection is presentation state, not an authorization mechanism.
- Never map `KKM`/`KKN`/other codes to `KKT` without an explicit verified mapping.
