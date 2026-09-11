import { normalizeKey } from './data.js';

export function parseRoute(search = '') {
  const params = search instanceof URLSearchParams
    ? search
    : new URLSearchParams(String(search).replace(/^\?/, ''));
  const job = params.get('job')?.trim() ?? '';
  const legacy = params.get('cat')?.trim() ?? '';
  const selected = job || legacy;
  return {
    kind: job ? 'job' : legacy ? 'legacy' : 'all',
    key: normalizeKey(selected || 'all'),
    query: params.get('q')?.trim() ?? '',
  };
}

export function routeForJob(job, query = '') {
  return {
    kind: job?.kind === 'legacy' ? 'legacy' : 'job',
    key: normalizeKey(job?.slug || job?.id || 'all'),
    query,
  };
}

export function routeQuery(route = {}) {
  const params = new URLSearchParams();
  if (route.kind === 'job' && route.key && route.key !== 'all') {
    params.set('job', normalizeKey(route.key));
  } else if (route.kind === 'legacy' && route.key && route.key !== 'all') {
    params.set('cat', normalizeKey(route.key));
  }
  if (route.query?.trim()) params.set('q', route.query.trim());
  return params.toString();
}

export function routeSearch(route = {}) {
  const query = routeQuery(route);
  return query ? `?${query}` : '';
}
