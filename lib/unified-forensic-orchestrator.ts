export type ForensicAudit = never;

export function runUnifiedForensicAudit(): never {
  throw new Error(
    'FRONTEND_AUDIT_LOGIC_DISABLED: Audit execution moved to forensic_core backend. Use /api/ingest proxy.'
  );
}
