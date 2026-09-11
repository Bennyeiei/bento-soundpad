import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogs = ['data/jobs.json', 'data/legacy-jobs.json'];
const missing = [];
let checked = 0;

for (const catalogPath of catalogs) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, catalogPath), 'utf8'));
  for (const job of catalog.jobs ?? []) {
    for (const sound of job.sounds ?? []) {
      if (!sound.file) continue;
      checked += 1;
      const absolute = path.resolve(root, sound.file);
      const audioRoot = path.resolve(root, 'audio') + path.sep;
      if (!absolute.startsWith(audioRoot)) {
        missing.push(`${catalogPath}:${job.id}:${sound.id} escapes audio/`);
      } else if (!fs.existsSync(absolute)) {
        missing.push(`${catalogPath}:${job.id}:${sound.id} -> ${sound.file}`);
      }
    }
  }
}

if (missing.length) {
  console.error(missing.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`asset validation passed: ${checked} referenced audio files`);
}
