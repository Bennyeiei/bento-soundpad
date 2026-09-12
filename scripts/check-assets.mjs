import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogs = ['data/jobs.json', 'data/legacy-jobs.json'];
const missing = [];
let checked = 0;

function checkSound(sound, owner) {
  if (!sound.file) return;
  checked += 1;
  const absolute = path.resolve(root, sound.file);
  const audioRoot = path.resolve(root, 'audio') + path.sep;
  if (!absolute.startsWith(audioRoot)) {
    missing.push(`${owner}:${sound.id} escapes audio/`);
  } else if (!fs.existsSync(absolute)) {
    missing.push(`${owner}:${sound.id} -> ${sound.file}`);
  }
}

for (const catalogPath of catalogs) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, catalogPath), 'utf8'));
  for (const job of catalog.jobs ?? []) {
    for (const sound of job.sounds ?? []) checkSound(sound, `${catalogPath}:${job.id}`);
  }
}

const glossaryPath = 'data/glossary.json';
const glossary = JSON.parse(fs.readFileSync(path.join(root, glossaryPath), 'utf8'));
for (const term of glossary.terms ?? []) checkSound(term, `${glossaryPath}:terms`);

if (missing.length) {
  console.error(missing.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`asset validation passed: ${checked} referenced audio files`);
}
