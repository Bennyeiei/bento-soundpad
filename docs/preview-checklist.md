# Local preview checklist

## Routes

- [ ] `/` shows `ทั้งหมด`, KKT10, KKT12, and legacy IDs without a console error.
- [ ] `/?job=kkt10` shows KKT10 and the header link points to `?job=kkt10`.
- [ ] `/?job=kkt12` shows 49 glossary-derived cards and the header link points to `?job=kkt12`.
- [ ] `/?job=kkt12&q=谢明兰` finds `เซี่ยหมิงหลาน` through its Chinese alias.
- [ ] `/?job=kkt10&q=ฉิน` filters label/pronunciation/alias.
- [ ] `/?job=unknown` shows a readable missing-job state and does not throw.
- [ ] `/?cat=kkm17` keeps the old job code and plays the existing file path.

## Interaction

- [ ] Click a KKT10 or KKT12 pad; generated MP3 should show FILE and play without relying on browser voices.
- [ ] Click a legacy pad; existing FILE audio remains usable.
- [ ] A broken file path falls back to TTS only when the browser has an actual speech voice, otherwise it reports the missing voice.
- [ ] `Space` stops playback; `1`–`9` play the visible cards.
- [ ] Volume and speed controls update active playback.
- [ ] Share button copies the current job-code link without the search query.
- [ ] Header job-code link is visible and copyable on a selected job.

## Responsive and accessibility

- [ ] Desktop sidebar and card grid resemble the original Bubble Voice layout.
- [ ] Mobile job selector fits by horizontal scrolling; primary controls do not clip.
- [ ] Every button/link has a visible keyboard focus ring.
- [ ] TTS/FILE state is written as text, not color alone.
- [ ] `prefers-reduced-motion` removes nonessential movement.
- [ ] No horizontal page overflow at 390px width.

## Offline/update

- [ ] Service worker uses the new cache name and refreshes `data/jobs.json` network-first.
- [ ] A hard reload after changing job selection keeps the same `?job=` URL.
