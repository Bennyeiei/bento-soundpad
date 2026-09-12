import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('shell keeps the original single-page controls and new job-link surface', () => {
  for (const marker of ['id="sidebar"', 'id="grid"', 'id="shareJob"', 'type="module"', 'src="./src/app.js"']) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /SOUNDS_FALLBACK|shareCat/);
});

test('job-code URL contract is documented', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /\?job=kkt10/);
  assert.match(readme, /\?job=kkt13/);
  assert.match(readme, /\?cat=kkm17/);
});

test('PWA caches imported modules, the central glossary and deep links', () => {
  for (const moduleName of ['audio.js', 'data.js', 'render.js', 'router.js']) {
    assert.match(sw, new RegExp(`\\./src/${moduleName}`));
  }
  assert.match(sw, /data\/glossary\.json/);
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /caches\.match\('\.\/'\)/);
});
