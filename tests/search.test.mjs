import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesSound, normalizeText, searchableText } from '../src/data.js';

test('normalizes whitespace for search without rewriting source data', () => {
  assert.equal(normalizeText('  ฉิน   อวี่  ชวน  '), 'ฉิน อวี่ ชวน');
});

test('searches label, pronunciation, alias and note', () => {
  const sound = {
    label: 'ฉิน อวี่ ชวน',
    pronunciation: 'ฉิน อวี่ ชวน',
    aliases: ['Qin Yu Chuan'],
    note: 'ไกด์เสียง',
  };
  assert.match(searchableText(sound), /ฉิน อวี่ ชวน/);
  assert.equal(matchesSound(sound, 'Qin Yu'), true);
  assert.equal(matchesSound(sound, 'ไกด์'), true);
  assert.equal(matchesSound(sound, 'ไม่มีคำนี้'), false);
});
