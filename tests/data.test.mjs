import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('current catalog contains the KKT10 job seed', () => {
  const catalog = read('data/jobs.json');
  const job = catalog.jobs.find((item) => item.id === 'KKT10');
  assert.ok(job);
  assert.equal(job.slug, 'kkt10');
  assert.equal(job.status, 'active');
  assert.ok(job.sounds.length >= 18);
  assert.ok(job.sounds.every((sound) => sound.type === 'tts'));
});

test('legacy catalog preserves both original IDs and audio paths', () => {
  const catalog = read('data/legacy-jobs.json');
  assert.deepEqual(catalog.jobs.map((job) => job.id), ['kkm15', 'kkm17']);
  assert.equal(catalog.jobs.reduce((count, job) => count + job.sounds.length, 0), 7);
  assert.ok(catalog.jobs.flatMap((job) => job.sounds).every((sound) => sound.file?.startsWith('audio/')));
});

test('all job slugs and sound IDs are unique within the combined catalog', () => {
  const current = read('data/jobs.json').jobs;
  const legacy = read('data/legacy-jobs.json').jobs;
  const jobs = [...current, ...legacy];
  assert.equal(new Set(jobs.map((job) => job.slug)).size, jobs.length);
  for (const job of jobs) {
    const ids = job.sounds.map((sound) => sound.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});
