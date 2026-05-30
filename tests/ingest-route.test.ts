import test from 'node:test';
import assert from 'node:assert/strict';

import { proxyIngestRequest } from '../lib/server/forensic-proxy.ts';

const jsonRequest = (payload: unknown) =>
  new Request('http://localhost/api/ingest', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

test('ingest proxy returns 401 when session missing', async () => {
  const response = await proxyIngestRequest(jsonRequest({ text: 'consumer credit report data' }), {
    getSession: async () => null,
    fetchImpl: fetch,
    forensicCoreBaseUrl: 'http://localhost:8010',
    forensicCoreServiceToken: 'token-123',
  });
  assert.equal(response.status, 401);
});

test('ingest proxy returns 503 when forensic core env missing', async () => {
  const response = await proxyIngestRequest(jsonRequest({ text: 'consumer credit report data' }), {
    getSession: async () => ({ user: { email: 'test@example.com', name: 'Test' } }),
    fetchImpl: fetch,
    forensicCoreBaseUrl: '',
    forensicCoreServiceToken: '',
  });
  assert.equal(response.status, 503);
});

test('ingest proxy returns 502 when backend unavailable', async () => {
  const response = await proxyIngestRequest(jsonRequest({ text: 'consumer credit report data' }), {
    getSession: async () => ({ user: { email: 'test@example.com', name: 'Test' } }),
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED');
    },
    forensicCoreBaseUrl: 'http://localhost:8010',
    forensicCoreServiceToken: 'token-123',
  });
  assert.equal(response.status, 502);
});

