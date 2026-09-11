# Local preview checklist

## Routes

- [ ] `/` shows `ทั้งหมด`, KKT10, and legacy IDs without a console error.
- [ ] `/?job=kkt10` shows KKT10 and the header link points to `?job=kkt10`.
- [ ] `/?job=kkt10&q=ฉิน` filters label/pronunciation/alias.
- [ ] `/?job=unknown` shows a readable missing-job state and does not throw.
- [ ] `/?cat=kkm17` keeps the old job code and plays the existing file path.

## Interaction

- [ ] Click each visible pad; KKT10 uses Thai TTS and legacy items use FILE.
- [ ] A broken file path falls back to TTS without an alert or uncaught error.
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
