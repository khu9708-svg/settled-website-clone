export type ApexSovereignResult = never;
export type ForensicTriangulationReport = never;
export const APEX_ENGINE_VERSION = 'frontend-audit-disabled';

export function runApexSovereignSync(): never {
  throw new Error('FRONTEND_AUDIT_LOGIC_DISABLED');
}

export async function apexSovereignAudit(): Promise<never> {
  throw new Error('FRONTEND_AUDIT_LOGIC_DISABLED');
}
