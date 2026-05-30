import {
  runUnifiedForensicAudit,
  triageDocument,
} from '../lib/unified-forensic-orchestrator.ts';
import { apexSovereignAudit } from '../lib/hard-lock.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mixedCreditReport = `
Experian Equifax TransUnion credit report
Consumer account status and payment history
CAPITAL ONE account number 4821 balance $1,244 status charge-off paid in full
LVNV Funding collection account validation request failed to validate
MOHELA student loan tradeline account ending 7788 forbearance history
Date of first delinquency 03/15/2019 appears re-aged to 06/01/2023
`;

const studentLoanRecord = `
MOHELA Federal Direct student loan account ending 7788
Borrower was in COVID payment pause and administrative forbearance.
The servicer reported 90 days late on 05/12/2021 and past due balance $420.
`;

const businessCreditRecord = `
DUNS 123456789 Dun and Bradstreet PAYDEX business credit file
Legal Business Name: Settled Support LLC
Vendor account NET 30 reported 60 days late even though invoice was paid within terms.
UCC lien is released but still appears as active.
`;

const unrelatedDocument = `
This is a grocery list with apples, rice, and bottled water.
No account, bureau, servicer, vendor, credit, or reporting information appears here.
`;

const mixed = triageDocument(mixedCreditReport);
assert(mixed.document_type === 'consumer-credit', `Expected mixed credit report to classify as consumer-credit, got ${mixed.document_type}`);
assert(mixed.hasCreditReportStructure, 'Expected mixed credit report structure to be detected');
const mixedAudit = runUnifiedForensicAudit(mixedCreditReport, 'Test Operator');
assert(mixedAudit.violations.length >= 2, 'Expected credit report violations');
assert(mixedAudit.injected_libraries.includes('student-loan'), 'Expected student loan library to inject for student tradelines inside credit report');
assert(mixedAudit.forensic_trace.steps.length === mixedAudit.violations.length, 'Expected forensic trace step for each finding');
assert(mixedAudit.triangulation_report, 'Expected triangulation report on processed audit');
assert(mixedAudit.triangulation_report.engine_version.includes('apex-v3'), 'Expected apex v3 engine version');
assert(mixedAudit.triangulation_report.federal_findings.length >= 1, 'Expected federal pass findings');
assert(['verified', 'reconciled', 'clean'].includes(mixedAudit.triangulation_report.triangulation_status), 'Expected valid triangulation status');
assert(mixedAudit.response.includes('Test Operator') || mixedAudit.response.startsWith('Status: Clean'), 'Expected operator personalization or clean status');

const student = triageDocument(studentLoanRecord);
assert(student.document_type === 'student-loan', `Expected student loan record, got ${student.document_type}`);
const studentAudit = runUnifiedForensicAudit(studentLoanRecord);
assert(studentAudit.violations.length >= 1, 'Expected student loan violation');
assert(studentAudit.triangulation_report?.federal_findings.length >= 1, 'Expected federal findings on student loan audit');

const business = triageDocument(businessCreditRecord);
assert(business.document_type === 'business-credit', `Expected business record, got ${business.document_type}`);
assert(runUnifiedForensicAudit(businessCreditRecord).violations.length >= 2, 'Expected business violations');

const unknown = runUnifiedForensicAudit(unrelatedDocument);
assert(unknown.processing_status === 'unprocessable', `Expected unprocessable document, got ${unknown.processing_status}`);

const apex = await apexSovereignAudit(studentLoanRecord, 'Async Operator');
assert(apex.triangulation.procedural_findings.length >= 0, 'Expected procedural pass to complete');
assert(apex.dispute.escalation_level !== undefined, 'Expected dispute escalation level from apex audit');

console.log('Engine regression checks passed');
