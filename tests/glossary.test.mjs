import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveGlossarySounds } from '../src/data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('resolves only the central terms referenced by a job', () => {
  const glossary = {
    terms: [
      {
        id: 'glossary-kkt13-001',
        label: 'กู้เจวี้ยนเฉิน',
        pronunciation: 'กู้เจวี้ยนเฉิน',
        aliases: ['กู้เจวี้ยนเฉิน'],
        type: 'tts',
        file: null,
      },
      {
        id: 'glossary-kkt13-002',
        label: 'กู้เจวียนเฉิน',
        pronunciation: 'กู้เจวียนเฉิน',
        aliases: ['กู้เจวียนเฉิน'],
        type: 'tts',
        file: null,
      },
      {
        id: 'glossary-kkt12-001',
        label: 'คำของงานอื่น',
        pronunciation: 'คำของงานอื่น',
        aliases: ['คำของงานอื่น'],
        type: 'tts',
        file: null,
      },
    ],
  };
  const job = {
    id: 'KKT13',
    sounds: [],
    glossaryRefs: ['glossary-kkt13-001', 'glossary-kkt13-002', 'missing-ref'],
  };

  const sounds = resolveGlossarySounds(job, glossary);

  assert.deepEqual(sounds.map((sound) => sound.label), ['กู้เจวี้ยนเฉิน', 'กู้เจวียนเฉิน']);
  assert.notEqual(sounds[0].id, sounds[1].id);
});

test('keeps inline job sounds and central terms in deterministic order', () => {
  const glossary = {
    terms: [{
      id: 'glossary-kkt13-001',
      label: 'ซูเข่อซิน',
      pronunciation: 'ซูเข่อซิน',
      aliases: ['ซูเข่อซิน'],
      type: 'tts',
      file: null,
    }],
  };
  const inline = {
    id: 'inline-001',
    label: 'รายการเดิม',
    pronunciation: 'รายการเดิม',
    aliases: ['รายการเดิม'],
    type: 'tts',
    file: null,
  };

  const sounds = resolveGlossarySounds({ sounds: [inline], glossaryRefs: ['glossary-kkt13-001'] }, glossary);

  assert.deepEqual(sounds.map((sound) => sound.id), ['inline-001', 'glossary-kkt13-001']);
});

test('does not duplicate a central term already present as a spaced inline card', () => {
  const glossary = {
    terms: [{
      id: 'glossary-kkt10-001',
      label: 'ฉินอวี่ชวน',
      pronunciation: 'ฉินอวี่ชวน',
      aliases: ['ฉินอวี่ชวน'],
      type: 'tts',
      file: null,
    }],
  };
  const inline = {
    id: 'inline-001',
    label: 'ฉิน อวี่ ชวน',
    pronunciation: 'ฉิน อวี่ ชวน',
    aliases: ['ฉิน อวี่ ชวน'],
    type: 'file',
    file: 'audio/kkt10/inline-001.mp3',
  };

  const sounds = resolveGlossarySounds({ sounds: [inline], glossaryRefs: ['glossary-kkt10-001'] }, glossary);

  assert.deepEqual(sounds.map((sound) => sound.id), ['inline-001']);
});

test('central glossary keeps exact spelling variants as separate entries', () => {
  const glossary = read('data/glossary.json');
  const variants = glossary.terms.filter((term) => ['กู้เจวี้ยนเฉิน', 'กู้เจวียนเฉิน'].includes(term.label));
  assert.equal(variants.length, 2);
  assert.notEqual(variants[0].id, variants[1].id);
});

test('KKT13 points at central glossary IDs instead of copying sound records', () => {
  const glossary = read('data/glossary.json');
  const jobs = read('data/jobs.json');
  const job = jobs.jobs.find((item) => item.id === 'KKT13');
  assert.ok(job);
  assert.equal(job.sounds.length, 0);
  assert.ok(job.glossaryRefs.length >= 10);
  const ids = new Set(glossary.terms.map((term) => term.id));
  assert.ok(job.glossaryRefs.every((id) => ids.has(id)));
  assert.ok(job.glossaryRefs.every((id) => id.startsWith('glossary-')));
});
