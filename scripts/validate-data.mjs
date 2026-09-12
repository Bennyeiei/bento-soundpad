import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const readJson = (relative) => {
  const file = path.join(root, relative);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${relative}: ${error.message}`);
    return {};
  }
};

const current = readJson('data/jobs.json');
const legacy = readJson('data/legacy-jobs.json');
const glossary = readJson('data/glossary.json');
const jobKeys = new Set();
const glossaryIds = new Set();
const glossaryLabels = new Set();
let soundCount = 0;

function validateSound(sound, prefix, soundKeys = null) {
  if (!sound || typeof sound !== 'object') {
    errors.push(`${prefix}: sound must be an object`);
    return;
  }
  const soundId = String(sound.id ?? '');
  if (!soundId) errors.push(`${prefix}: missing id`);
  if (soundKeys && soundKeys.has(soundId)) errors.push(`${prefix}: duplicate sound id ${soundId}`);
  soundKeys?.add(soundId);
  const label = String(sound.label ?? '').trim();
  const pronunciation = String(sound.pronunciation ?? '').trim();
  if (!label) errors.push(`${prefix}: missing label`);
  if (!pronunciation) errors.push(`${prefix}: missing pronunciation`);
  if (!['tts', 'file'].includes(sound.type)) errors.push(`${prefix}: type must be tts or file`);
  if (!Array.isArray(sound.aliases)) errors.push(`${prefix}: aliases must be an array`);
  if (sound.file !== null && sound.file !== undefined) {
    const file = String(sound.file);
    if (!file.startsWith('audio/') || file.includes('..')) errors.push(`${prefix}: unsafe file path ${file}`);
  }
}

function validateGlossaryTerm(term, index) {
  const prefix = `data/glossary.json.terms[${index}]`;
  if (!term || typeof term !== 'object') {
    errors.push(`${prefix}: term must be an object`);
    return;
  }
  validateSound(term, prefix);
  const id = String(term.id ?? '');
  const label = String(term.label ?? '').trim();
  if (!/^glossary-[a-z-]+-[a-f0-9]{12}$/.test(id)) errors.push(`${prefix}: invalid glossary id ${id}`);
  if (glossaryIds.has(id)) errors.push(`${prefix}: duplicate glossary id ${id}`);
  glossaryIds.add(id);
  if (glossaryLabels.has(label)) errors.push(`${prefix}: duplicate exact label ${label}`);
  glossaryLabels.add(label);
  if (!['name', 'place', 'specific-term'].includes(term.kind)) errors.push(`${prefix}: invalid kind ${term.kind}`);
  if (!Number.isInteger(term.priority) || term.priority < 1) errors.push(`${prefix}: priority must be a positive integer`);
  if (term.status !== 'candidate') errors.push(`${prefix}: status must be candidate`);
  if (!Array.isArray(term.sourceJobs) || term.sourceJobs.length === 0) errors.push(`${prefix}: sourceJobs must be a non-empty array`);
  for (const job of term.sourceJobs ?? []) {
    if (!/^KKT\d+$/.test(String(job))) errors.push(`${prefix}: invalid source job ${job}`);
  }
  const textFields = [label, String(term.pronunciation ?? ''), ...(term.aliases ?? [])];
  if (textFields.some((value) => /[\/()[\]{}]/.test(String(value)))) {
    errors.push(`${prefix}: label/pronunciation/aliases cannot contain slash or brackets`);
  }
}

(glossary.terms ?? []).forEach(validateGlossaryTerm);

function validateJob(job, source, expectedKind) {
  if (!job || typeof job !== 'object') {
    errors.push(`${source}: job must be an object`);
    return;
  }
  const id = String(job.id ?? '');
  const slug = String(job.slug ?? '');
  const key = slug.toLowerCase();
  const idPattern = expectedKind === 'legacy' ? /^[a-z]{2,5}\d+$/ : /^[A-Z]{2,5}\d+$/;
  if (!idPattern.test(id)) errors.push(`${source}: invalid job id ${id}`);
  if (!/^[a-z]{2,5}\d+$/.test(slug)) errors.push(`${source}: invalid job slug ${slug}`);
  if (jobKeys.has(key)) errors.push(`${source}: duplicate job slug ${slug}`);
  jobKeys.add(key);
  if (expectedKind === 'legacy' && job.kind !== 'legacy') errors.push(`${source}: legacy job must keep kind=legacy`);

  if (job.glossaryRefs !== undefined) {
    if (!Array.isArray(job.glossaryRefs)) {
      errors.push(`${source}: glossaryRefs must be an array`);
    } else {
      const refs = new Set();
      for (const ref of job.glossaryRefs) {
        if (typeof ref !== 'string' || !glossaryIds.has(ref)) errors.push(`${source}: unknown glossary ref ${ref}`);
        if (refs.has(ref)) errors.push(`${source}: duplicate glossary ref ${ref}`);
        refs.add(ref);
      }
    }
  }

  if (!Array.isArray(job.sounds)) {
    errors.push(`${source}: sounds must be an array`);
    return;
  }
  const soundKeys = new Set();
  for (const [index, sound] of job.sounds.entries()) {
    validateSound(sound, `${source}.sounds[${index}]`, soundKeys);
    soundCount += 1;
  }
}

(current.jobs ?? []).forEach((job, index) => validateJob(job, `data/jobs.json.jobs[${index}]`, 'current'));
(legacy.jobs ?? []).forEach((job, index) => validateJob(job, `data/legacy-jobs.json.jobs[${index}]`, 'legacy'));

const legacyMap = readJson('data/legacy-map.json');
if (!Array.isArray(legacyMap.mappings)) errors.push('data/legacy-map.json: mappings must be an array');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`data validation passed: ${jobKeys.size} jobs, ${soundCount} inline sounds, ${glossaryIds.size} central terms`);
}
