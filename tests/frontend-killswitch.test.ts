import test from 'node:test';
import assert from 'node:assert/strict';

import { runUnifiedForensicAudit } from '../lib/unified-forensic-orchestrator.ts';
import { apexSovereignAudit, runApexSovereignSync } from '../lib/hard-lock.ts';

test('frontend orchestrator execution is disabled', () => {
  assert.throws(
    () => runUnifiedForensicAudit(),
    /FRONTEND_AUDIT_LOGIC_DISABLED/
  );
});

test('frontend hard-lock sync execution is disabled', () => {
  assert.throws(
    () => runApexSovereignSync(),
    /FRONTEND_AUDIT_LOGIC_DISABLED/
  );
});

test('frontend hard-lock async execution is disabled', async () => {
  await assert.rejects(
    async () => apexSovereignAudit(),
    /FRONTEND_AUDIT_LOGIC_DISABLED/
  );
});

