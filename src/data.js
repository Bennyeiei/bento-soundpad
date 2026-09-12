export const normalizeKey = (value) => String(value ?? '').trim().toLowerCase();

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('th-TH')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchableText(sound) {
  return [sound?.label, sound?.pronunciation, ...(sound?.aliases ?? []), sound?.note]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ');
}

export function matchesSound(sound, query) {
  const needle = normalizeText(query);
  return !needle || searchableText(sound).includes(needle);
}

function soundIdentity(sound) {
  return normalizeText(sound?.label).replace(/\s+/g, '');
}

function centralTermsById(glossary) {
  return new Map((glossary?.terms ?? [])
    .filter((term) => term && typeof term.id === 'string')
    .map((term) => [term.id, term]));
}

export function resolveGlossarySounds(job, glossary) {
  const inlineSounds = Array.isArray(job?.sounds) ? job.sounds : [];
  const byId = centralTermsById(glossary);
  const seen = new Set(inlineSounds.map(soundIdentity).filter(Boolean));
  const referencedSounds = (Array.isArray(job?.glossaryRefs) ? job.glossaryRefs : [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((term) => {
      const identity = soundIdentity(term);
      if (!identity || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .map((term) => ({ ...term }));
  return [...inlineSounds, ...referencedSounds];
}

function withKind(job, kind, glossary) {
  return {
    ...job,
    kind,
    sounds: resolveGlossarySounds(job, glossary),
  };
}

export async function loadCatalog() {
  const [currentResponse, legacyResponse, glossaryResponse] = await Promise.all([
    fetch(new URL('../data/jobs.json', import.meta.url), { cache: 'no-store' }),
    fetch(new URL('../data/legacy-jobs.json', import.meta.url), { cache: 'no-store' }),
    fetch(new URL('../data/glossary.json', import.meta.url), { cache: 'no-store' }),
  ]);
  if (!currentResponse.ok || !legacyResponse.ok || !glossaryResponse.ok) {
    throw new Error('โหลด catalog ของงานไม่สำเร็จ');
  }
  const [current, legacy, glossary] = await Promise.all([
    currentResponse.json(),
    legacyResponse.json(),
    glossaryResponse.json(),
  ]);
  return {
    branding: current.branding ?? {},
    glossary,
    jobs: (current.jobs ?? []).map((job) => withKind(job, 'job', glossary)),
    legacyJobs: (legacy.jobs ?? []).map((job) => withKind(job, 'legacy', glossary)),
  };
}

export function allJobs(catalog) {
  return [...(catalog?.jobs ?? []), ...(catalog?.legacyJobs ?? [])];
}

export function findJob(catalog, key, kind = 'all') {
  const normalized = normalizeKey(key);
  if (!normalized || normalized === 'all') return null;
  const candidates = kind === 'legacy'
    ? (catalog?.legacyJobs ?? [])
    : kind === 'job'
      ? (catalog?.jobs ?? [])
      : allJobs(catalog);
  return candidates.find((job) => normalizeKey(job.id) === normalized || normalizeKey(job.slug) === normalized) ?? null;
}

export function listEntries(catalog, selectedJob, query = '') {
  const jobs = selectedJob ? [selectedJob] : allJobs(catalog);
  return jobs.flatMap((job) => job.sounds
    .filter((sound) => matchesSound(sound, query))
    .map((sound) => ({ job, sound })));
}
