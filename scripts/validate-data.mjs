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
const jobKeys = new Set();
let soundCount = 0;

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
  if (!Array.isArray(job.sounds)) {
    errors.push(`${source}: sounds must be an array`);
    return;
  }
  const soundKeys = new Set();
  for (const [index, sound] of job.sounds.entries()) {
    const prefix = `${source}.sounds[${index}]`;
    if (!sound || typeof sound !== 'object') {
      errors.push(`${prefix}: sound must be an object`);
      continue;
    }
    const soundId = String(sound.id ?? '');
    if (!soundId) errors.push(`${prefix}: missing id`);
    if (soundKeys.has(soundId)) errors.push(`${prefix}: duplicate sound id ${soundId}`);
    soundKeys.add(soundId);
    if (!String(sound.label ?? '').trim()) errors.push(`${prefix}: missing label`);
    if (!String(sound.pronunciation ?? '').trim()) errors.push(`${prefix}: missing pronunciation`);
    if (!['tts', 'file'].includes(sound.type)) errors.push(`${prefix}: type must be tts or file`);
    if (!Array.isArray(sound.aliases)) errors.push(`${prefix}: aliases must be an array`);
    if (sound.file !== null && sound.file !== undefined) {
      const file = String(sound.file);
      if (!file.startsWith('audio/') || file.includes('..')) errors.push(`${prefix}: unsafe file path ${file}`);
    }
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
  console.log(`data validation passed: ${jobKeys.size} jobs, ${soundCount} sounds`);
}
