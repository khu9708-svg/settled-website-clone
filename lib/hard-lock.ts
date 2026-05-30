import library from './violation-libraries.json' with { type: 'json' };
import {
  extractFacts,
  triageDocument,
  type ExtractedFacts,
  type ForensicDomain,
  type ForensicFinding,
  type Severity,
} from './forensic-intake.ts';

export const APEX_ENGINE_VERSION = 'settled-apex-v3-steroid-locked';

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

type ProceduralRule = {
  id: string;
  title: string;
  severity: Severity;
  statutes: string[];
  patternsAny: string[];
  patternsAll: string[];
  description: string;
  action: string;
};

export type IngestFacts = ExtractedFacts & {
  documentText: string;
  document_type: ForensicDomain;
  document_confidence: number;
  injected_libraries: Array<Exclude<ForensicDomain, 'unknown'>>;
  analysis_id: string;
};

export type StatutoryPassResult = {
  pass: 'federal' | 'state' | 'procedural';
  findings: ForensicFinding[];
  statutes_cited: string[];
  pass_status: 'complete' | 'skipped';
};

export type AuditPacket = {
  facts: IngestFacts;
  federal: StatutoryPassResult;
  state: StatutoryPassResult;
  procedural: StatutoryPassResult;
  merged_findings: ForensicFinding[];
};

export type ShadowVerification = {
  status: 'verified' | 'reconciled' | 'clean';
  killed_findings: string[];
  reran_passes: string[];
  contradictions_resolved: number;
  orphan_findings_removed: number;
  final_findings: ForensicFinding[];
};

export type SovereignDisputeOutput = {
  severity_tier: 'low' | 'medium' | 'critical';
  document_output: 'clean_status' | 'round_1_dispute' | 'round_2_escalation' | 'legal_demand';
  response: string;
  escalation_level: 'round_1' | 'round_2' | 'legal_demand' | 'none';
  confidence: number;
};

export type ForensicTriangulationReport = {
  facts: ExtractedFacts;
  federal_findings: ForensicFinding[];
  state_findings: ForensicFinding[];
  procedural_findings: ForensicFinding[];
  shadow_verification: ShadowVerification;
  severity_tier: 'low' | 'medium' | 'critical';
  evidence_packet: string[];
  triangulation_status: 'verified' | 'reconciled' | 'clean';
  engine_version: string;
};

export type ApexSovereignResult = {
  triangulation: ForensicTriangulationReport;
  violations: ForensicFinding[];
  dispute: SovereignDisputeOutput;
  processing_status: 'processed' | 'unprocessable';
  unprocessable_reason?: string;
};

const CLEAN_STATUS_RESPONSE = 'Status: Clean. No reportable anomalies identified.';

const FEDERAL_STATUTE_MARKERS = [
  '15 u.s.c',
  '34 c.f.r',
  'cares act',
  'higher education act',
  'bankruptcy',
  'metro 2',
  'fdcpa',
  'fcra',
];

const STATE_STATUTE_MARKERS = [
  'state',
  'udap',
  'attorney general',
  'consumer protection act',
  'debt collection act',
  'fair debt',
];

const PROCEDURAL_CROSS_RULES: ProceduralRule[] = [
  {
    id: 'proc-dispute-no-mov',
    title: 'Dispute marked verified without method of verification',
    severity: 'high',
    statutes: ['15 U.S.C. § 1681i(a)(7)', '15 U.S.C. § 1681e(b)'],
    patternsAny: ['verified as accurate', 'no change after dispute', 'account verified', 'dispute completed'],
    patternsAll: ['dispute|disputed|consumer disputes', 'method of verification|mov|documents reviewed'],
    description: 'The record suggests a dispute may have been closed without a documented method of verification.',
    action: 'Demand the method of verification, documents reviewed, and reinvestigation notes for each disputed field.',
  },
  {
    id: 'proc-incomplete-investigation',
    title: 'Incomplete reinvestigation or automated verification response',
    severity: 'high',
    statutes: ['15 U.S.C. § 1681i(a)', '15 U.S.C. § 1681e(b)'],
    patternsAny: ['automated response', 'could not locate', 'unable to verify', 'insufficient information', 'no records found'],
    patternsAll: ['investigation|reinvestigation|dispute|verified|updated'],
    description: 'The furnisher or bureau response may indicate an incomplete or non-substantive investigation.',
    action: 'Demand competent source records and a reasonable investigation of the specific disputed items.',
  },
  {
    id: 'proc-missing-furnisher-direct',
    title: 'Bureau dispute without furnisher direct dispute trail',
    severity: 'medium',
    statutes: ['15 U.S.C. § 1681s-2(b)', '15 U.S.C. § 1681i'],
    patternsAny: ['bureau dispute', 'credit bureau dispute', 'disputed with experian', 'disputed with equifax', 'disputed with transunion'],
    patternsAll: ['furnisher|collector|creditor|servicer', 'no response|pending|unresolved|still reporting'],
    description: 'A bureau-side dispute may not show corresponding furnisher-level investigation or correction.',
    action: 'Demand furnisher direct-dispute records and bureau ACDV/e-OSCAR transmission proof.',
  },
  {
    id: 'proc-stale-public-record',
    title: 'Stale or satisfied public record still reporting active',
    severity: 'high',
    statutes: ['15 U.S.C. § 1681e(b)', 'UCC Article 9', 'public-record verification procedures'],
    patternsAny: ['released lien', 'satisfied judgment', 'lien released', 'judgment satisfied', 'ucc terminated'],
    patternsAll: ['active|open|current|reported|balance|file'],
    description: 'A released or satisfied public record may still appear as active on the file.',
    action: 'Demand filing office records, release or satisfaction proof, and deletion or correction of stale public-record reporting.',
  },
];

const STATE_CROSS_RULES: ProceduralRule[] = [
  {
    id: 'state-udap-accuracy',
    title: 'State consumer protection accuracy cross-check',
    severity: 'medium',
    statutes: ['State UDAP / consumer protection statutes', '15 U.S.C. § 1681n state-law overlay'],
    patternsAny: ['deceptive', 'misleading', 'unfair practice', 'false representation', 'inaccurate reporting'],
    patternsAll: ['account|balance|status|report|collection|servicer'],
    description: 'Reporting language may implicate state unfair or deceptive practices alongside federal accuracy duties.',
    action: 'Preserve state UDAP claims and demand source-level correction with written verification.',
  },
  {
    id: 'state-ag-complaint-trail',
    title: 'State attorney general or regulator complaint trail',
    severity: 'medium',
    statutes: ['State attorney general consumer protection authority'],
    patternsAny: ['attorney general', 'state regulator', 'consumer protection division', 'ag complaint', 'state investigation'],
    patternsAll: ['complaint|investigation|report|account|servicer|collector'],
    description: 'The document references state-level enforcement or complaint activity tied to reporting accuracy.',
    action: 'Demand all records exchanged with state regulators and correction of any confirmed inaccuracies.',
  },
];

function lower(text: string) {
  return text.toLowerCase();
}

function compact(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
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

function isFederalStatute(statutes: string[]) {
  const joined = lower(statutes.join(' '));
  return FEDERAL_STATUTE_MARKERS.some(marker => joined.includes(marker));
}

function isStateStatute(statutes: string[]) {
  const joined = lower(statutes.join(' '));
  return STATE_STATUTE_MARKERS.some(marker => joined.includes(marker));
}

function injectedLibraries(documentText: string, documentType: ForensicDomain) {
  if (documentType === 'unknown') return [] as Array<Exclude<ForensicDomain, 'unknown'>>;
  const libraries = new Set<Exclude<ForensicDomain, 'unknown'>>();
  libraries.add(documentType);

  const countSignals = (signals: string[]) =>
    signals.reduce((score, signal) => score + (lower(documentText).includes(signal.toLowerCase()) ? 1 : 0), 0);

  if (documentType === 'consumer-credit' && countSignals(library.domains['student-loan'].signals) >= 2) {
    libraries.add('student-loan');
  }
  if (documentType === 'business-credit' && countSignals(library.domains['consumer-credit'].signals) >= 3) {
    libraries.add('consumer-credit');
  }
  return [...libraries];
}

function executeLibraryRule(documentText: string, facts: ExtractedFacts, rule: Rule): ForensicFinding | null {
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

function executeProceduralRule(documentText: string, facts: ExtractedFacts, rule: ProceduralRule): ForensicFinding | null {
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
    bureau: first(facts.bureaus, 'Credit bureau not isolated'),
    furnisher: first(facts.furnishers, 'Reporting source not isolated'),
    account_number: first(facts.accountNumbers, 'Account number not isolated'),
    evidence,
    recommended_action: rule.action,
    rule_id: rule.id,
    library_domain: 'consumer-credit',
  };
}

function dedupeFindings(findings: ForensicFinding[]) {
  const seen = new Map<string, ForensicFinding>();
  for (const finding of findings) {
    const key = finding.rule_id;
    const existing = seen.get(key);
    if (!existing || severityRank(finding.severity) > severityRank(existing.severity)) {
      seen.set(key, finding);
    }
  }
  return [...seen.values()];
}

function severityRank(severity: Severity) {
  if (severity === 'critical') return 3;
  if (severity === 'high') return 2;
  return 1;
}

export function parallelIngest(rawInput: string): IngestFacts {
  const documentText = rawInput.trim();
  const triage = triageDocument(documentText);
  const extracted = extractFacts(documentText);
  return {
    ...extracted,
    documentText,
    document_type: triage.document_type,
    document_confidence: triage.document_confidence,
    injected_libraries: injectedLibraries(documentText, triage.document_type),
    analysis_id: `apex-${hashText(documentText.slice(0, 8000))}`,
  };
}

export function auditFederalStatute(facts: IngestFacts): StatutoryPassResult {
  if (facts.document_type === 'unknown' || !facts.injected_libraries.length) {
    return { pass: 'federal', findings: [], statutes_cited: [], pass_status: 'skipped' };
  }

  const findings = (library.rules as Rule[])
    .filter(rule => facts.injected_libraries.includes(rule.domain))
    .filter(rule => isFederalStatute(rule.statutes) || !isStateStatute(rule.statutes))
    .map(rule => executeLibraryRule(facts.documentText, facts, rule))
    .filter((finding): finding is ForensicFinding => Boolean(finding));

  return {
    pass: 'federal',
    findings,
    statutes_cited: unique(findings.flatMap(finding => finding.statute.split('; ').map(compact))),
    pass_status: 'complete',
  };
}

export function auditStateJurisdiction(facts: IngestFacts): StatutoryPassResult {
  if (facts.document_type === 'unknown') {
    return { pass: 'state', findings: [], statutes_cited: [], pass_status: 'skipped' };
  }

  const libraryStateFindings = (library.rules as Rule[])
    .filter(rule => facts.injected_libraries.includes(rule.domain))
    .filter(rule => isStateStatute(rule.statutes))
    .map(rule => executeLibraryRule(facts.documentText, facts, rule))
    .filter((finding): finding is ForensicFinding => Boolean(finding));

  const crossFindings = STATE_CROSS_RULES.map(rule => executeProceduralRule(facts.documentText, facts, rule)).filter(
    (finding): finding is ForensicFinding => Boolean(finding)
  );

  const findings = dedupeFindings([...libraryStateFindings, ...crossFindings]);

  return {
    pass: 'state',
    findings,
    statutes_cited: unique(findings.flatMap(finding => finding.statute.split('; ').map(compact))),
    pass_status: 'complete',
  };
}

export function auditProceduralCompliance(facts: IngestFacts): StatutoryPassResult {
  if (facts.document_type === 'unknown') {
    return { pass: 'procedural', findings: [], statutes_cited: [], pass_status: 'skipped' };
  }

  const findings = PROCEDURAL_CROSS_RULES.map(rule => executeProceduralRule(facts.documentText, facts, rule)).filter(
    (finding): finding is ForensicFinding => Boolean(finding)
  );

  return {
    pass: 'procedural',
    findings,
    statutes_cited: unique(findings.flatMap(finding => finding.statute.split('; ').map(compact))),
    pass_status: 'complete',
  };
}

export function performShadowAudit(auditPacket: AuditPacket): ShadowVerification {
  const merged = dedupeFindings(auditPacket.merged_findings);
  const killed: string[] = [];
  const reran: string[] = [];
  let contradictions = 0;
  let orphans = 0;

  const byTitle = new Map<string, ForensicFinding[]>();
  for (const finding of merged) {
    const key = lower(finding.item);
    const group = byTitle.get(key) || [];
    group.push(finding);
    byTitle.set(key, group);
  }

  const reconciled: ForensicFinding[] = [];
  for (const [, group] of byTitle) {
    if (group.length === 1) {
      reconciled.push(group[0]);
      continue;
    }

    const severities = unique(group.map(item => item.severity));
    if (severities.length > 1) {
      contradictions += 1;
      reran.push('severity_reconciliation');
      const winner = group.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
      for (const loser of group) {
        if (loser.rule_id !== winner.rule_id) killed.push(loser.rule_id);
      }
      reconciled.push(winner);
      continue;
    }
    reconciled.push(group[0]);
  }

  const verified = reconciled.filter(finding => {
    if (!finding.evidence || finding.evidence.length < 12) {
      orphans += 1;
      killed.push(finding.rule_id);
      return false;
    }
    return true;
  });

  const status: ShadowVerification['status'] =
    verified.length === 0 ? 'clean' : contradictions > 0 || orphans > 0 ? 'reconciled' : 'verified';

  return {
    status,
    killed_findings: unique(killed),
    reran_passes: unique(reran),
    contradictions_resolved: contradictions,
    orphan_findings_removed: orphans,
    final_findings: verified,
  };
}

function severityTier(findings: ForensicFinding[]): 'low' | 'medium' | 'critical' {
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;
  if (critical >= 1) return 'critical';
  if (high >= 2 || findings.length >= 4) return 'medium';
  if (findings.length >= 1) return 'low';
  return 'low';
}

function composeDisputeResponse(findings: ForensicFinding[], facts: IngestFacts, operatorName?: string) {
  if (!findings.length) return CLEAN_STATUS_RESPONSE;

  const operator = operatorName?.trim() || 'Forensic Operator';
  const issueBlock = findings
    .map(
      (violation, index) =>
        `${index + 1}. ${violation.item}\nAuthority: ${violation.statute}\nEvidence: ${violation.evidence}\nRequired action: ${violation.recommended_action}`
    )
    .join('\n\n');

  return `Forensic operator: ${operator}\nTriangulation audit — federal, state, and procedural passes reconciled.\n\nDisputed findings:\n${issueBlock}\n\nComplete reinvestigation, preserve source records, and provide written results with verification method for each disputed item.\n\nDeterministic rule matches only. No conversational inference.`;
}

export function synthesizeSovereignDispute(
  finalVerification: ShadowVerification,
  facts: IngestFacts,
  operatorName?: string
): SovereignDisputeOutput {
  const findings = finalVerification.final_findings;
  const tier = severityTier(findings);
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;

  if (!findings.length) {
    return {
      severity_tier: 'low',
      document_output: 'clean_status',
      response: CLEAN_STATUS_RESPONSE,
      escalation_level: 'none',
      confidence: 0,
    };
  }

  const escalation_level =
    critical >= 2 ? 'legal_demand' : critical || high >= 2 ? 'round_2' : 'round_1';

  const document_output =
    escalation_level === 'legal_demand'
      ? 'legal_demand'
      : escalation_level === 'round_2'
        ? 'round_2_escalation'
        : 'round_1_dispute';

  const confidence = Math.min(
    97,
    58 + critical * 14 + high * 8 + findings.length * 4 + Math.floor(facts.document_confidence / 10)
  );

  return {
    severity_tier: tier,
    document_output,
    response: composeDisputeResponse(findings, facts, operatorName),
    escalation_level,
    confidence,
  };
}

function buildTriangulationReport(
  facts: IngestFacts,
  federal: StatutoryPassResult,
  state: StatutoryPassResult,
  procedural: StatutoryPassResult,
  shadow: ShadowVerification,
  dispute: SovereignDisputeOutput
): ForensicTriangulationReport {
  return {
    facts: {
      bureaus: facts.bureaus,
      furnishers: facts.furnishers,
      accountNumbers: facts.accountNumbers,
      dates: facts.dates,
      amounts: facts.amounts,
      statuses: facts.statuses,
      documentSignals: facts.documentSignals,
    },
    federal_findings: federal.findings,
    state_findings: state.findings,
    procedural_findings: procedural.findings,
    shadow_verification: shadow,
    severity_tier: dispute.severity_tier,
    evidence_packet: shadow.final_findings.map(finding => finding.evidence).slice(0, 24),
    triangulation_status: shadow.status,
    engine_version: APEX_ENGINE_VERSION,
  };
}

export function runApexSovereignSync(rawInput: string, operatorName?: string): ApexSovereignResult {
  const facts = parallelIngest(rawInput);
  const federal = auditFederalStatute(facts);
  const state = auditStateJurisdiction(facts);
  const procedural = auditProceduralCompliance(facts);

  const merged_findings = dedupeFindings([...federal.findings, ...state.findings, ...procedural.findings]);
  const auditPacket: AuditPacket = { facts, federal, state, procedural, merged_findings };
  const shadow = performShadowAudit(auditPacket);
  const dispute = synthesizeSovereignDispute(shadow, facts, operatorName);
  const triangulation = buildTriangulationReport(facts, federal, state, procedural, shadow, dispute);

  return {
    triangulation,
    violations: shadow.final_findings,
    dispute,
    processing_status: 'processed',
  };
}

export async function apexSovereignAudit(rawInput: string, operatorName?: string): Promise<ApexSovereignResult> {
  const facts = await Promise.resolve(parallelIngest(rawInput));
  const [federal, state, procedural] = await Promise.all([
    Promise.resolve(auditFederalStatute(facts)),
    Promise.resolve(auditStateJurisdiction(facts)),
    Promise.resolve(auditProceduralCompliance(facts)),
  ]);

  const merged_findings = dedupeFindings([...federal.findings, ...state.findings, ...procedural.findings]);
  const auditPacket: AuditPacket = { facts, federal, state, procedural, merged_findings };
  const shadow = await Promise.resolve(performShadowAudit(auditPacket));
  const dispute = await Promise.resolve(synthesizeSovereignDispute(shadow, facts, operatorName));
  const triangulation = buildTriangulationReport(facts, federal, state, procedural, shadow, dispute);

  return {
    triangulation,
    violations: shadow.final_findings,
    dispute,
    processing_status: 'processed',
  };
}
