import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlaybackKind, getTtsText, scaledTtsRate } from '../src/audio.js';

test('prefers a real file when the asset is usable', () => {
  assert.equal(getPlaybackKind({ file: 'audio/example.mp3' }, true), 'file');
  assert.equal(getPlaybackKind({ file: 'audio/example.mp3' }, false), 'tts');
});

test('uses pronunciation as the TTS source and applies baseline speed', () => {
  const item = { label: 'ชื่อ', pronunciation: 'คำอ่าน', tts: { rate: 0.85 } };
  assert.equal(getTtsText(item), 'คำอ่าน');
  assert.equal(scaledTtsRate(item, 1), 0.85);
  assert.equal(scaledTtsRate(item, 1.25), 1.0625);
});
