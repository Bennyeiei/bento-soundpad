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

function withKind(job, kind) {
  return { ...job, kind, sounds: Array.isArray(job.sounds) ? job.sounds : [] };
}

export async function loadCatalog() {
  const [currentResponse, legacyResponse] = await Promise.all([
    fetch(new URL('../data/jobs.json', import.meta.url), { cache: 'no-store' }),
    fetch(new URL('../data/legacy-jobs.json', import.meta.url), { cache: 'no-store' }),
  ]);
  if (!currentResponse.ok || !legacyResponse.ok) {
    throw new Error('โหลด catalog ของงานไม่สำเร็จ');
  }
  const [current, legacy] = await Promise.all([
    currentResponse.json(),
    legacyResponse.json(),
  ]);
  return {
    branding: current.branding ?? {},
    jobs: (current.jobs ?? []).map((job) => withKind(job, 'job')),
    legacyJobs: (legacy.jobs ?? []).map((job) => withKind(job, 'legacy')),
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
