import library from './violation-libraries.json' with { type: 'json' };
import { APEX_ENGINE_VERSION, runApexSovereignSync, type ForensicTriangulationReport } from './hard-lock.ts';
import {
  extractFacts,
  triageDocument,
  type ExtractedFacts,
  type ForensicDomain,
  type ForensicFinding,
} from './forensic-intake.ts';

export type { ForensicTriangulationReport } from './hard-lock.ts';
export { extractFacts, triageDocument } from './forensic-intake.ts';
export type { ExtractedFacts, ForensicDomain, ForensicFinding } from './forensic-intake.ts';

export type LegacyCaseType = 'disputes' | 'student-loans' | 'business';

export type ForensicAudit = {
  violations: ForensicFinding[];
  response: string;
  confidence: number;
  escalation_level: 'round_1' | 'round_2' | 'legal_demand' | 'none';
  summary: string;
  processing_status: 'processed' | 'unprocessable';
  unprocessable_reason?: string;
  document_type: ForensicDomain;
  legacy_case_type: LegacyCaseType | 'unknown';
  document_confidence: number;
  injected_libraries: Array<Exclude<ForensicDomain, 'unknown'>>;
  extracted_facts: ExtractedFacts;
  engine_version: string;
  analysis_id: string;
  forensic_trace: ForensicTrace;
  triangulation_report?: ForensicTriangulationReport;
};

export type ForensicTraceStep = {
  document_fact: string;
  library_rule_id: string;
  statutory_basis: string;
  logical_conclusion: string;
};

export type ForensicTrace = {
  trace_id: string;
  generated_at: string;
  document_type: ForensicDomain;
  document_confidence: number;
  injected_libraries: Array<Exclude<ForensicDomain, 'unknown'>>;
  steps: ForensicTraceStep[];
  integrity_note: string;
};

const CLEAN_STATUS_RESPONSE = 'Status: Clean. No reportable anomalies identified.';

const UNPROCESSABLE_RESPONSE =
  'SETTLED stopped the audit because the document could not be read or classified with enough confidence. Upload a cleaner PDF or paste the full text from the report. The system will not generate a dispute from corrupted, incomplete, or unrecognizable input.';

function compact(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function hashText(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function countSignals(text: string, signals: string[]) {
  const haystack = text.toLowerCase();
  return signals.reduce((score, signal) => score + (haystack.includes(signal.toLowerCase()) ? 1 : 0), 0);
}

function injectedLibraries(documentText: string, documentType: ForensicDomain) {
  if (documentType === 'unknown') return [];
  const libraries = new Set<Exclude<ForensicDomain, 'unknown'>>();
  libraries.add(documentType);

  if (documentType === 'consumer-credit' && countSignals(documentText, library.domains['student-loan'].signals) >= 2) {
    libraries.add('student-loan');
  }

  if (documentType === 'business-credit' && countSignals(documentText, library.domains['consumer-credit'].signals) >= 3) {
    libraries.add('consumer-credit');
  }

  return [...libraries];
}

function legacyCaseType(domain: ForensicDomain): LegacyCaseType | 'unknown' {
  if (domain === 'consumer-credit') return 'disputes';
  if (domain === 'student-loan') return 'student-loans';
  if (domain === 'business-credit') return 'business';
  return 'unknown';
}

function getUnprocessableReason(documentText: string, triage: ReturnType<typeof triageDocument>) {
  const clean = compact(documentText);
  const alphaNumericCount = (clean.match(/[a-z0-9]/gi) || []).length;
  const replacementCount = (clean.match(/[�]/g) || []).length;
  const signalCount = Object.values(triage.scores).reduce((sum, score) => sum + score, 0);

  if (clean.length < 35) return 'The document text is too short to audit.';
  if (alphaNumericCount < 25) return 'The extracted text does not contain enough readable account or report information.';
  if (replacementCount > 20) return 'The extracted text appears corrupted.';
  if (triage.document_type === 'unknown' || signalCount === 0) return 'The document does not contain enough recognizable credit, student loan, or business credit signals.';
  return '';
}

function buildTrace(audit: Omit<ForensicAudit, 'response' | 'forensic_trace'>): ForensicTrace {
  return {
    trace_id: audit.analysis_id,
    generated_at: new Date().toISOString(),
    document_type: audit.document_type,
    document_confidence: audit.document_confidence,
    injected_libraries: audit.injected_libraries,
    steps: audit.violations.map(violation => ({
      document_fact: violation.evidence,
      library_rule_id: violation.rule_id,
      statutory_basis: violation.statute,
      logical_conclusion: `${violation.item}: ${violation.description}`,
    })),
    integrity_note:
      audit.processing_status === 'unprocessable'
        ? 'No forensic conclusion was generated because the input failed readability or triage thresholds.'
        : 'Each finding maps a document fact to a deterministic library rule and a stated logical conclusion.',
  };
}

export function runUnifiedForensicAudit(documentText: string, operatorName?: string): ForensicAudit {
  const text = documentText.trim();
  const triage = triageDocument(text);
  const facts = extractFacts(text);
  const analysis_id = `ufo-${hashText(text.slice(0, 8000))}`;
  const unprocessableReason = getUnprocessableReason(text, triage);

  if (unprocessableReason) {
    const auditWithoutResponse: Omit<ForensicAudit, 'response' | 'forensic_trace' | 'triangulation_report'> = {
      violations: [],
      confidence: 0,
      escalation_level: 'none',
      summary: 'Document unprocessable',
      processing_status: 'unprocessable',
      unprocessable_reason: unprocessableReason,
      document_type: triage.document_type,
      legacy_case_type: legacyCaseType(triage.document_type),
      document_confidence: triage.document_confidence,
      injected_libraries: [],
      extracted_facts: facts,
      engine_version: APEX_ENGINE_VERSION,
      analysis_id,
    };

    return {
      ...auditWithoutResponse,
      response: UNPROCESSABLE_RESPONSE,
      forensic_trace: buildTrace(auditWithoutResponse),
    };
  }

  const apex = runApexSovereignSync(text, operatorName);
  const violations = apex.violations;
  const libraries = injectedLibraries(text, triage.document_type);

  const auditWithoutResponse: Omit<ForensicAudit, 'response' | 'forensic_trace' | 'triangulation_report'> = {
    violations,
    confidence: apex.dispute.confidence,
    escalation_level: apex.dispute.escalation_level,
    summary: violations[0]?.description || CLEAN_STATUS_RESPONSE,
    processing_status: 'processed',
    document_type: triage.document_type,
    legacy_case_type: legacyCaseType(triage.document_type),
    document_confidence: triage.document_confidence,
    injected_libraries: libraries,
    extracted_facts: facts,
    engine_version: APEX_ENGINE_VERSION,
    analysis_id,
  };

  return {
    ...auditWithoutResponse,
    response: apex.dispute.response,
    forensic_trace: buildTrace(auditWithoutResponse),
    triangulation_report: apex.triangulation,
  };
}
