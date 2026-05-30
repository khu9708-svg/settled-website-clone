import { NextRequest, NextResponse } from 'next/server';
import { runUnifiedForensicAudit } from '@/lib/unified-forensic-orchestrator';
import { titanLog } from '@/lib/titan-log';
import { assessPdfReadability } from '@/lib/pdf-quality-gate';
import { auth } from '@/app/api/auth/auth';
import { hasBusinessDomainAccess, recordMetricEvent } from '@/lib/db';

export const runtime = 'nodejs';
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MIN_TEXT_CHARS = 30;
const PDF_HEADER = Buffer.from('%PDF-');
const WARNING_PDF_CLEANUP_APPLIED = 'Applied deterministic PDF cleanup before extraction.';
const WARNING_SECONDARY_ENGINE_RECOVERY =
  'Secondary forensic parser recovered text from a degraded PDF.';
const WARNING_OCR_REQUIRED =
  'Readable text could not be extracted from the PDF. If this is a scan or image-only report, add supplemental text and re-run.';
const WARNING_STRUCTURAL_FALLBACK =
  'The PDF appears structurally degraded. Intake continued in recovery mode with limited extraction.';
const WARNING_WORD_FALLBACK =
  'Word extraction required deterministic fallback reconstruction from document fragments.';
const WARNING_TEXT_FRAGMENT_RECOVERY =
  'Partial text fragments were reconstructed from a degraded document stream.';

type ExtractionResult = {
  text: string;
  warnings: string[];
};

type IngestPayload = {
  file: File | null;
  supplementalText: string;
  domainHint: 'consumer-credit' | 'student-loan' | 'business-credit' | 'unknown';
  inputMode: 'multipart' | 'json';
};

function normalizeDomainHint(value: unknown): IngestPayload['domainHint'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'consumer-credit' || normalized === 'student-loan' || normalized === 'business-credit') {
    return normalized;
  }
  return 'unknown';
}

function preprocessPdfBuffer(buffer: Buffer): Buffer {
  let candidate = buffer;
  if (!candidate.subarray(0, 5).equals(PDF_HEADER)) {
    const headerOffset = candidate.indexOf(PDF_HEADER);
    if (headerOffset > 0 && headerOffset <= 2048) {
      candidate = candidate.subarray(headerOffset);
    }
  }

  let end = candidate.length;
  while (end > 0 && candidate[end - 1] === 0) end -= 1;
  return end === candidate.length ? candidate : candidate.subarray(0, end);
}

async function parsePdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error('EMPTY_PDF_TEXT');
    }
    return text;
  } finally {
    await parser.destroy();
  }
}

async function parsePdfTextWithPdfJs(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  let pdfDocument: any = null;
  try {
    pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
      const page = await pdfDocument.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    const text = pageTexts.join('\n').trim();
    if (!text) {
      throw new Error('EMPTY_PDF_TEXT');
    }

    return text;
  } finally {
    if (pdfDocument) {
      await pdfDocument.destroy();
    } else {
      await loadingTask.destroy();
    }
  }
}

async function parseDocxText(buffer: Buffer): Promise<string> {
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default ?? mammothModule;
  const result = await mammoth.extractRawText({ buffer });
  const text = String(result.value || '').trim();
  if (!text) {
    throw new Error('EMPTY_WORD_TEXT');
  }
  return text;
}

async function parseWordTextWithExtractor(buffer: Buffer): Promise<string> {
  const extractorModule = await import('word-extractor');
  const WordExtractor = extractorModule.default ?? extractorModule;
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(buffer);
  const text = [
    typeof extracted.getBody === 'function' ? extracted.getBody() : '',
    typeof extracted.getFootnotes === 'function' ? extracted.getFootnotes() : '',
    typeof extracted.getEndnotes === 'function' ? extracted.getEndnotes() : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('EMPTY_WORD_TEXT');
  }

  return text;
}

function extractTextFragmentsFromBuffer(buffer: Buffer): string {
  const candidate = buffer.toString('latin1');
  const fragments =
    candidate
      .match(/[A-Za-z0-9][A-Za-z0-9 \t,.;:'"()\-_/\\[\]@#&]{7,}/g)
      ?.map(fragment => fragment.replace(/\s+/g, ' ').trim())
      .filter(Boolean) || [];

  return fragments.slice(0, 80).join('\n').trim();
}

function isLikelyGibberish(text: string): boolean {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length < MIN_TEXT_CHARS) return true;

  const alphaNumericCount = (compact.match(/[a-z0-9]/gi) || []).length;
  const replacementCount = (compact.match(/[�]/g) || []).length;
  const alphaNumericRatio = compact.length > 0 ? alphaNumericCount / compact.length : 0;

  return alphaNumericCount < 25 || replacementCount > 20 || alphaNumericRatio < 0.28;
}

async function extractPdfText(file: File): Promise<ExtractionResult> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  if (originalBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const readability = assessPdfReadability(originalBuffer);
  const warnings = [...readability.warnings];

  let primaryError: Error | null = null;
  try {
    if (!originalBuffer.subarray(0, 5).equals(PDF_HEADER)) {
      throw new Error('NON_PDF_UPLOAD');
    }
    const text = await parsePdfText(originalBuffer);
    return { text, warnings };
  } catch (error) {
    primaryError = error instanceof Error ? error : new Error('PDF_EXTRACT_FAILED');
  }

  // One deterministic self-healing pass before reject.
  const cleanedBuffer = preprocessPdfBuffer(originalBuffer);
  if (cleanedBuffer.length !== originalBuffer.length || !originalBuffer.subarray(0, 5).equals(PDF_HEADER)) {
    warnings.push(WARNING_PDF_CLEANUP_APPLIED);
  }

  try {
    if (!cleanedBuffer.subarray(0, 5).equals(PDF_HEADER)) {
      throw new Error('NON_PDF_UPLOAD');
    }
    const text = await parsePdfText(cleanedBuffer);
    return { text, warnings };
  } catch (error) {
    const recoveryError = error instanceof Error ? error : new Error('PDF_EXTRACT_FAILED');
    if (recoveryError.message === 'NON_PDF_UPLOAD' && primaryError?.message === 'NON_PDF_UPLOAD') {
      throw new Error('NON_PDF_UPLOAD');
    }

    try {
      const recoveredText = await parsePdfTextWithPdfJs(cleanedBuffer);
      return {
        text: recoveredText,
        warnings: Array.from(new Set([...warnings, WARNING_SECONDARY_ENGINE_RECOVERY])),
      };
    } catch {
      if (recoveryError.message === 'EMPTY_PDF_TEXT' || primaryError?.message === 'EMPTY_PDF_TEXT') {
        const fragments = extractTextFragmentsFromBuffer(cleanedBuffer);
        if (fragments) {
          return {
            text: fragments,
            warnings: Array.from(new Set([...warnings, WARNING_TEXT_FRAGMENT_RECOVERY, WARNING_OCR_REQUIRED])),
          };
        }
        return { text: '', warnings: Array.from(new Set([...warnings, WARNING_OCR_REQUIRED])) };
      }
      const fragments = extractTextFragmentsFromBuffer(cleanedBuffer);
      if (fragments) {
        return {
          text: fragments,
          warnings: Array.from(new Set([...warnings, WARNING_TEXT_FRAGMENT_RECOVERY, WARNING_STRUCTURAL_FALLBACK])),
        };
      }
      return { text: '', warnings: Array.from(new Set([...warnings, WARNING_STRUCTURAL_FALLBACK])) };
    }
  }
}

async function extractWordText(file: File): Promise<ExtractionResult> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  if (originalBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const lowerName = file.name.toLowerCase();
  const warnings: string[] = [];
  const isDocx = lowerName.endsWith('.docx');

  try {
    const text = isDocx ? await parseDocxText(originalBuffer) : await parseWordTextWithExtractor(originalBuffer);
    return { text, warnings };
  } catch {
    try {
      const text = isDocx ? await parseWordTextWithExtractor(originalBuffer) : await parseDocxText(originalBuffer);
      return { text, warnings: [WARNING_WORD_FALLBACK] };
    } catch {
      const fragments = extractTextFragmentsFromBuffer(originalBuffer);
      if (fragments) {
        return {
          text: fragments,
          warnings: [WARNING_WORD_FALLBACK, WARNING_TEXT_FRAGMENT_RECOVERY],
        };
      }
      return {
        text: '',
        warnings: [WARNING_WORD_FALLBACK, 'Word document could not be fully decoded; supplemental text is recommended.'],
      };
    }
  }
}

async function extractFileText(file: File): Promise<ExtractionResult> {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx');
  const isDoc = file.type === 'application/msword' || lowerName.endsWith('.doc');

  if (isPdf) return extractPdfText(file);
  if (isDoc || isDocx) return extractWordText(file);
  throw new Error('UNSUPPORTED_FILE_TYPE');
}

async function readIngestPayload(request: NextRequest): Promise<IngestPayload> {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const maybeFile = formData.get('document');
    const file = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;
    const supplementalText = String(formData.get('text') || '').trim();
    const domainHint = normalizeDomainHint(formData.get('domain_hint'));
    return { file, supplementalText, domainHint, inputMode: 'multipart' };
  }

  if (contentType.includes('application/json')) {
    let body: any;
    try {
      body = await request.json();
    } catch {
      throw new Error('INVALID_JSON_BODY');
    }

    const supplementalText = typeof body?.text === 'string' ? body.text.trim() : '';
    const domainHint = normalizeDomainHint(body?.domain_hint);
    return { file: null, supplementalText, domainHint, inputMode: 'json' };
  }

  throw new Error('UNSUPPORTED_CONTENT_TYPE');
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const { file, supplementalText, domainHint, inputMode } = await readIngestPayload(request);
    const session = await auth();
    const userEmail = session?.user?.email || null;

    if (domainHint === 'business-credit') {
      if (!userEmail) {
        return NextResponse.json(
          {
            error: 'BUSINESS_PLAN_REQUIRED',
            message: 'Sign in with an active Business Engine plan to run business credit forensics.',
          },
          { status: 401 }
        );
      }
      const canAccessBusiness = await hasBusinessDomainAccess(userEmail);
      if (!canAccessBusiness) {
        return NextResponse.json(
          {
            error: 'BUSINESS_PLAN_REQUIRED',
            message: 'Business Engine tier is required for business credit domain access.',
          },
          { status: 403 }
        );
      }
    }

    if (!file && !supplementalText) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'Provide either a supported document upload (.pdf, .doc, .docx) or pasted text.',
          details: 'MISSING_INPUT',
        },
        { status: 422 }
      );
    }

    if (!file && supplementalText.length < MIN_TEXT_CHARS) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: `Pasted text is too short. Provide at least ${MIN_TEXT_CHARS} characters of forensic source text.`,
          details: 'TEXT_TOO_SHORT',
        },
        { status: 422 }
      );
    }

    const warnings: string[] = [];
    const extraction = file ? await extractFileText(file) : { text: '', warnings: [] };
    warnings.push(...extraction.warnings);
    const documentText = `${extraction.text}\n${supplementalText}`.trim();

    if (!documentText) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'The input remained unreadable after deterministic extraction attempts.',
          details: 'NO_READABLE_TEXT',
          warnings,
        },
        { status: 422 }
      );
    }

    if (isLikelyGibberish(documentText)) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'Input appears corrupted or gibberish after deterministic extraction attempts.',
          details: 'GIBBERISH_INPUT',
          warnings,
        },
        { status: 422 }
      );
    }

    const operatorName = session?.user?.name || session?.user?.email?.split('@')[0] || undefined;
    const audit = runUnifiedForensicAudit(documentText, operatorName);
    titanLog({
      event: 'forensic_ingest',
      analysisId: audit.analysis_id,
      documentType: audit.document_type,
      status: audit.processing_status,
      latencyMs: Date.now() - startedAt,
      findings: audit.violations.length,
    });

    if (audit.processing_status === 'unprocessable') {
      await recordMetricEvent({
        id: `audit_unprocessable:${audit.analysis_id}`,
        eventName: 'forensic.audit_unprocessable',
        userEmail,
        domain: domainHint === 'unknown' ? audit.document_type : domainHint,
        analysisId: audit.analysis_id,
        metadata: {
          reason: audit.unprocessable_reason || 'UNPROCESSABLE',
          inputMode,
        },
      });
      return NextResponse.json({
        ...audit,
        error: 'UNPROCESSABLE_DOCUMENT',
        message: audit.unprocessable_reason || 'Input remained unprocessable after deterministic extraction attempts.',
        warnings,
      }, { status: 422 });
    }

    await recordMetricEvent({
      id: `audit_completed:${audit.analysis_id}`,
      eventName: 'forensic.audit_completed',
      userEmail,
      domain: audit.document_type,
      analysisId: audit.analysis_id,
      metadata: {
        violations: audit.violations.length,
        confidence: audit.confidence,
        inputMode,
      },
    });

    return NextResponse.json({
      ...audit,
      input_mode: inputMode,
      domain_hint: domainHint,
      degraded: warnings.length > 0,
      warnings,
      message: warnings[0],
      triangulation: audit.triangulation_report
        ? {
            status: audit.triangulation_report.triangulation_status,
            severity_tier: audit.triangulation_report.severity_tier,
            federal_count: audit.triangulation_report.federal_findings.length,
            state_count: audit.triangulation_report.state_findings.length,
            procedural_count: audit.triangulation_report.procedural_findings.length,
            shadow_killed: audit.triangulation_report.shadow_verification.killed_findings.length,
            engine_version: audit.triangulation_report.engine_version,
          }
        : undefined,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    titanLog({
      event: 'forensic_ingest_error',
      status: 'unprocessable',
      latencyMs: Date.now() - startedAt,
    });

    const encryptedOrUnreadable = (() => {
      if (details === 'NON_PDF_UPLOAD') {
        return 'Only valid PDF uploads are accepted.';
      }
      if (details === 'FILE_TOO_LARGE') {
        return 'The uploaded file exceeds the maximum supported size (20MB).';
      }
      if (details === 'UNSUPPORTED_FILE_TYPE') {
        return 'Only PDF and Word uploads are supported (.pdf, .doc, .docx).';
      }
      if (details === 'UNSUPPORTED_CONTENT_TYPE') {
        return 'Unsupported content type. Use multipart/form-data for file uploads or application/json for text-only ingestion.';
      }
      if (details === 'INVALID_JSON_BODY') {
        return 'The JSON body could not be parsed. Send { "text": "..." } as valid JSON.';
      }
      return 'The intake payload could not be processed. Submit readable text or a supported document (.pdf, .doc, .docx).';
    })();

    return NextResponse.json(
      {
        error: 'UNPROCESSABLE_DOCUMENT',
        message: encryptedOrUnreadable,
        details,
      },
      { status: 422 }
    );
  }
}
