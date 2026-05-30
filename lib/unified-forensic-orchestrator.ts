import library from './violation-libraries.json' with { type: 'json' };

export type ForensicDomain = 'consumer-credit' | 'student-loan' | 'business-credit' | 'unknown';
export type LegacyCaseType = 'disputes' | 'student-loans' | 'business';
export type Severity = 'critical' | 'high' | 'medium';

type Rule = {
  id: string;
  domain: Exclude<ForensicDomain, 'unknown'>;
  title: string;
  severity: Severity;
  statutes: string[];
  patternsAny: string[];
  patternsAll: string[];
  description: string;
  action: string;
};

export type ExtractedFacts = {
  bureaus: string[];
  furnishers: string[];
  accountNumbers: string[];
  dates: string[];
  amounts: string[];
  statuses: string[];
  documentSignals: string[];
};

export type ForensicFinding = {
  item: string;
  statute: string;
  severity: Severity;
  description: string;
  account_detail: string;
  bureau: string;
  furnisher: string;
  account_number: string;
  evidence: string;
  recommended_action: string;
  rule_id: string;
  library_domain: Exclude<ForensicDomain, 'unknown'>;
};

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

const bureaus = ['Experian', 'Equifax', 'TransUnion', 'Dun & Bradstreet', 'D&B', 'SBFE', 'Experian Business', 'Equifax Business'];

function lower(text: string) {
  return text.toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

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

function matchPattern(text: string, pattern: string) {
  const haystack = lower(text);
  return pattern
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .some(part => haystack.includes(part.toLowerCase()));
}

function countSignals(text: string, signals: string[]) {
  const haystack = lower(text);
  return signals.reduce((score, signal) => score + (haystack.includes(signal.toLowerCase()) ? 1 : 0), 0);
}

function signalHits(text: string, signals: string[]) {
  const haystack = lower(text);
  return signals.filter(signal => haystack.includes(signal.toLowerCase()));
}

function lineMatches(text: string, pattern: RegExp) {
  return text
    .split(/\r?\n/)
    .map(compact)
    .filter(line => pattern.test(line));
}

function first(values: string[], fallback: string) {
  return values[0] || fallback;
}

function evidenceWindow(text: string, patterns: string[]) {
  const haystack = lower(text);
  const positions = patterns
    .flatMap(pattern => pattern.split('|').map(part => part.trim()).filter(Boolean))
    .map(part => haystack.indexOf(part.toLowerCase()))
    .filter(position => position >= 0)
    .sort((a, b) => a - b);

  const start = Math.max(0, (positions[0] ?? 0) - 170);
  const end = Math.min(text.length, (positions[0] ?? 0) + 340);
  return compact(text.slice(start, end)).slice(0, 700);
}

export function extractFacts(documentText: string): ExtractedFacts {
  const accountNumbers = unique([
    ...Array.from(documentText.matchAll(/(?:account|acct|loan|tradeline|reference|duns|ein)\s*(?:number|#|no\.?|id)?\s*[:#-]?\s*([A-Z0-9*X-]{4,28})/gi)).map(match => match[1]),
    ...Array.from(documentText.matchAll(/\b(?:ending in|ends in|acct ending)\s*([0-9X*]{3,8})\b/gi)).map(match => `ending ${match[1]}`)
  ]);
  const dates = unique(Array.from(documentText.matchAll(/\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/gi)).map(match => match[0]));
  const amounts = unique(Array.from(documentText.matchAll(/\$[\d,]+(?:\.\d{2})?/g)).map(match => match[0]));
  const documentSignals = unique([
    ...signalHits(documentText, library.domains['consumer-credit'].signals),
    ...signalHits(documentText, library.domains['student-loan'].signals),
    ...signalHits(documentText, library.domains['business-credit'].signals),
  ]);

  return {
    bureaus: unique(bureaus.filter(bureau => lower(documentText).includes(bureau.toLowerCase()))),
    furnishers: unique(lineMatches(documentText, /\b(?:capital one|discover|chase|citi|synchrony|lvnv|portfolio recovery|midland|navient|mohela|aidvantage|nelnet|department of education|fedloan|great lakes|dun|experian business|equifax business|sba|ppp|eidl|vendor|collector)\b/i).slice(0, 14)),
    accountNumbers: accountNumbers.slice(0, 18),
    dates: dates.slice(0, 22),
    amounts: amounts.slice(0, 22),
    statuses: unique(lineMatches(documentText, /\b(?:late|delinquent|charge.?off|collection|paid|closed|open|current|settled|discharged|transferred|forbearance|deferment|bankruptcy|past due|forgiven|released|satisfied|duplicate)\b/i).slice(0, 16)),
    documentSignals: documentSignals.slice(0, 30),
  };
}

export function triageDocument(documentText: string) {
  const consumerScore = countSignals(documentText, library.domains['consumer-credit'].signals);
  const studentScore = countSignals(documentText, library.domains['student-loan'].signals);
  const businessScore = countSignals(documentText, library.domains['business-credit'].signals);
  const hasCreditReportStructure =
    countSignals(documentText, ['experian', 'equifax', 'transunion']) > 0 &&
    countSignals(documentText, ['account', 'balance', 'status', 'payment history', 'date opened', 'tradeline']) >= 2;
  const hasBusinessIdentity =
    businessScore > 0 &&
    countSignals(documentText, ['duns', 'paydex', 'business credit', 'experian business', 'equifax business', 'vendor account', 'ucc', 'ein']) > 0;

  let document_type: ForensicDomain = 'unknown';
  if (hasBusinessIdentity && businessScore >= Math.max(consumerScore, studentScore)) {
    document_type = 'business-credit';
  } else if (hasCreditReportStructure) {
    document_type = 'consumer-credit';
  } else if (studentScore > Math.max(consumerScore, businessScore)) {
    document_type = 'student-loan';
  } else if (consumerScore > 0 || businessScore > 0) {
    document_type = consumerScore >= businessScore ? 'consumer-credit' : 'business-credit';
  }

  const bestScore = Math.max(consumerScore, studentScore, businessScore);
  const total = Math.max(1, consumerScore + studentScore + businessScore);
  const document_confidence = document_type === 'unknown' ? 0 : Math.min(99, Math.max(25, Math.round((bestScore / total) * 100)));

  return {
    document_type,
    document_confidence,
    scores: {
      'consumer-credit': consumerScore,
      'student-loan': studentScore,
      'business-credit': businessScore,
    },
    hasCreditReportStructure,
    hasBusinessIdentity,
  };
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

function executeRule(documentText: string, facts: ExtractedFacts, rule: Rule): ForensicFinding | null {
  const anyMatched = rule.patternsAny.some(pattern => matchPattern(documentText, pattern));
  const allMatched = rule.patternsAll.every(pattern => matchPattern(documentText, pattern));
  if (!anyMatched || !allMatched) return null;

  const evidence = evidenceWindow(documentText, [...rule.patternsAny, ...rule.patternsAll]);
  return {
    item: rule.title,
    statute: rule.statutes.join('; '),
    severity: rule.severity,
    description: rule.description,
    account_detail: evidence,
    bureau: first(facts.bureaus, rule.domain === 'business-credit' ? 'Business credit reporting source not isolated' : 'Credit bureau not isolated'),
    furnisher: first(facts.furnishers, 'Reporting source not isolated'),
    account_number: first(facts.accountNumbers, 'Account number not isolated'),
    evidence,
    recommended_action: rule.action,
    rule_id: rule.id,
    library_domain: rule.domain,
  };
}

function composeLetter(audit: Omit<ForensicAudit, 'response' | 'forensic_trace'>) {
  if (!audit.violations.length) return CLEAN_STATUS_RESPONSE;

  const variant = parseInt(audit.analysis_id.slice(-2), 16) % 4;
  const facts = audit.extracted_facts;
  const bureau = first(facts.bureaus, audit.document_type === 'business-credit' ? 'the business credit reporting source' : 'the credit reporting agency');
  const furnisher = first(facts.furnishers, 'the reporting source');
  const account = first(facts.accountNumbers, 'the account identified in the document');
  const date = first(facts.dates, 'the reporting period shown in the document');
  const amount = first(facts.amounts, 'the reported amount shown in the document');
  const libraries = audit.injected_libraries.map(domain => library.domains[domain].label).join(' + ');

  const openings = [
    `This forensic dispute is directed to ${bureau} and ${furnisher} because the uploaded record contains document-supported reporting failures tied to ${account}.`,
    `The audit record does not support automated verification. It identifies ${account}, ${furnisher}, ${date}, and ${amount} as facts requiring source-level investigation.`,
    `SETTLED's deterministic audit isolated reporting defects that require investigation before this information can continue being reported as complete and accurate.`,
    `Treat this as a formal evidence-backed dispute demanding investigation, correction, deletion, and preservation of the source records used to verify ${account}.`
  ];

  const issueBlock = audit.violations
    .map((violation, index) =>
      `${index + 1}. ${violation.item}\nLibrary: ${library.domains[violation.library_domain].label}\nAuthority: ${violation.statute}\nEvidence: ${violation.evidence}\nRequired action: ${violation.recommended_action}`
    )
    .join('\n\n');

  const closings = [
    'Complete the reinvestigation within the required investigation period, preserve the source records used to verify the reporting, and send written results with the corrected file.',
    'If the reporting cannot be verified through competent source documentation, it must be corrected or deleted. Automated confirmation is not a reasonable investigation.',
    'Failure to investigate the specific evidence provided may create liability under applicable accuracy, investigation, and verification duties.',
    'Forward this dispute and all supporting evidence to each reporting source, complete a reasonable investigation, and provide the method of verification with the final result.'
  ];

  return `${openings[variant]}\n\nInjected statutory libraries: ${libraries}.\n\nDisputed findings:\n${issueBlock}\n\n${closings[variant]}\n\nThis output is generated from structured document evidence and deterministic rule matches. It is not a goodwill request and it is not a generic template.`;
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

export function runUnifiedForensicAudit(documentText: string): ForensicAudit {
  const text = documentText.trim();
  const triage = triageDocument(text);
  const facts = extractFacts(text);
  const analysis_id = `ufo-${hashText(text.slice(0, 8000))}`;
  const unprocessableReason = getUnprocessableReason(text, triage);

  if (unprocessableReason) {
    const auditWithoutResponse: Omit<ForensicAudit, 'response' | 'forensic_trace'> = {
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
      engine_version: library.version,
      analysis_id,
    };

    return {
      ...auditWithoutResponse,
      response: UNPROCESSABLE_RESPONSE,
      forensic_trace: buildTrace(auditWithoutResponse),
    };
  }

  const libraries = injectedLibraries(text, triage.document_type);

  const violations = (library.rules as Rule[])
    .filter(rule => libraries.includes(rule.domain))
    .map(rule => executeRule(text, facts, rule))
    .filter((finding): finding is ForensicFinding => Boolean(finding));

  const critical = violations.filter(violation => violation.severity === 'critical').length;
  const high = violations.filter(violation => violation.severity === 'high').length;
  const confidence = violations.length
    ? Math.min(97, 58 + critical * 14 + high * 8 + violations.length * 4 + Math.floor(triage.document_confidence / 10))
    : 0;

  const auditWithoutResponse: Omit<ForensicAudit, 'response' | 'forensic_trace'> = {
    violations,
    confidence,
    escalation_level: critical >= 2 ? 'legal_demand' : critical || high >= 2 ? 'round_2' : violations.length ? 'round_1' : 'none',
    summary: violations[0]?.description || CLEAN_STATUS_RESPONSE,
    processing_status: 'processed',
    document_type: triage.document_type,
    legacy_case_type: legacyCaseType(triage.document_type),
    document_confidence: triage.document_confidence,
    injected_libraries: libraries,
    extracted_facts: facts,
    engine_version: library.version,
    analysis_id,
  };

  return {
    ...auditWithoutResponse,
    response: composeLetter(auditWithoutResponse),
    forensic_trace: buildTrace(auditWithoutResponse),
  };
}
