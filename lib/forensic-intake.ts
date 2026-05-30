import library from './violation-libraries.json' with { type: 'json' };

export type ForensicDomain = 'consumer-credit' | 'student-loan' | 'business-credit' | 'unknown';
export type Severity = 'critical' | 'high' | 'medium';

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
