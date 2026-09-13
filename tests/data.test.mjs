import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('current catalog contains the KKT10 job seed with generated audio', () => {
  const catalog = read('data/jobs.json');
  const job = catalog.jobs.find((item) => item.id === 'KKT10');
  assert.ok(job);
  assert.equal(job.slug, 'kkt10');
  assert.equal(job.status, 'active');
  assert.ok(job.sounds.length >= 18);
  assert.ok(job.sounds.every((sound) => sound.type === 'file' && sound.file?.startsWith('audio/kkt10/')));
});

test('current catalog contains the cleaned KKT12 glossary job', () => {
  const catalog = read('data/jobs.json');
  const seed = read('data/kkt12-job.json');
  const job = catalog.jobs.find((item) => item.id === 'KKT12');
  assert.ok(job);
  assert.equal(job.slug, 'kkt12');
  assert.equal(job.source, 'Chinese-Thai Drama Glossary · KKT12_01');
  assert.equal(job.sounds.length, 62);
  assert.equal(seed.sounds.length, 62);
  assert.deepEqual(job.sounds.map((sound) => sound.label), seed.sounds.map((sound) => sound.label));
  assert.ok(job.sounds.some((sound) => sound.aliases.includes('谢明兰')));
  assert.ok(job.sounds.every((sound) => sound.type === 'file' && sound.file?.startsWith('audio/kkt12/')));
});

test('KKT12 keeps difficult terms as separate clean cards', () => {
  const job = read('data/jobs.json').jobs.find((item) => item.id === 'KKT12');
  const labels = job.sounds.map((sound) => sound.label);

  assert.ok(labels.includes('เซี่ยหมิงหลาน'));
  assert.ok(labels.includes('หมิงหลาน'));
  assert.ok(labels.includes('เซี่ยโม่หลาน'));
  assert.ok(labels.includes('โม่หลาน'));
  assert.ok(labels.includes('องค์ชายเก้า'));
  assert.ok(labels.includes('เสียวจิ่ว'));
  assert.ok(labels.includes('แม่เผยเหิง'));
  assert.ok(labels.includes('ฮูหยินผู้เฒ่าเผย'));
  assert.ok(labels.includes('คนคุมบ่อน'));
  assert.ok(labels.includes('เจ้าของบ่อน'));
  assert.ok(labels.includes('กรมพระคลัง'));
  assert.ok(labels.includes('กรมการคลัง'));
  assert.equal(labels.includes('เผยเหิง (วัยเด็ก)'), false);
  assert.equal(labels.includes('องค์ชายเก้า / เสียวจิ่ว'), false);
  assert.equal(labels.includes('สาวใช้โม่หลาน'), false);
  assert.equal(labels.includes('ฮ่องเต้ / ฝ่าบาท'), false);
  assert.equal(labels.includes('ฮ่องเต้'), false);
  assert.equal(labels.includes('ฝ่าบาท'), false);
  assert.ok(labels.every((label) => !/[\\/()[\\]]/.test(label)));
  assert.ok(job.sounds.every((sound) => !/[\\/()[\\]]/.test(sound.pronunciation)));
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
