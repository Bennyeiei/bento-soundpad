import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoute, routeForJob, routeSearch } from '../src/router.js';

test('parses a current job link and search query', () => {
  assert.deepEqual(parseRoute('?job=KKT10&q=ฉิน อวี่'), {
    kind: 'job',
    key: 'kkt10',
    query: 'ฉิน อวี่',
  });
});

test('keeps old cat links in the legacy namespace', () => {
  const route = parseRoute('?cat=kkm17');
  assert.deepEqual(route, { kind: 'legacy', key: 'kkm17', query: '' });
  assert.equal(routeSearch(route), '?cat=kkm17');
});

test('creates a shareable link from the canonical job code', () => {
  const link = routeSearch(routeForJob({ kind: 'job', id: 'KKT10', slug: 'kkt10' }));
  assert.equal(link, '?job=kkt10');
});

test('normalizes keys without losing the visible search text', () => {
  assert.equal(routeSearch({ kind: 'job', key: 'KKT10', query: '  ฉิน  ' }), '?job=kkt10&q=%E0%B8%89%E0%B8%B4%E0%B8%99');
});
