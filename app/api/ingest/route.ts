import { NextRequest, NextResponse } from 'next/server';
import { runUnifiedForensicAudit } from '@/lib/unified-forensic-orchestrator';
import { titanLog } from '@/lib/titan-log';

export const runtime = 'nodejs';
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const PDF_HEADER = Buffer.from('%PDF-');

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

async function extractFileText(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new Error('NON_PDF_UPLOAD');
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  if (originalBuffer.length > MAX_PDF_BYTES) {
    throw new Error('PDF_TOO_LARGE');
  }

  let primaryError: Error | null = null;
  try {
    if (!originalBuffer.subarray(0, 5).equals(PDF_HEADER)) {
      throw new Error('NON_PDF_UPLOAD');
    }
    return await parsePdfText(originalBuffer);
  } catch (error) {
    primaryError = error instanceof Error ? error : new Error('PDF_EXTRACT_FAILED');
  }

  // One deterministic self-healing pass before reject.
  try {
    const cleanedBuffer = preprocessPdfBuffer(originalBuffer);
    if (!cleanedBuffer.subarray(0, 5).equals(PDF_HEADER)) {
      throw new Error('NON_PDF_UPLOAD');
    }
    return await parsePdfText(cleanedBuffer);
  } catch (error) {
    const recoveryError = error instanceof Error ? error : new Error('PDF_EXTRACT_FAILED');
    if (recoveryError.message === 'EMPTY_PDF_TEXT' || primaryError?.message === 'EMPTY_PDF_TEXT') {
      throw new Error('EMPTY_PDF_TEXT');
    }
    if (recoveryError.message === 'NON_PDF_UPLOAD' && primaryError?.message === 'NON_PDF_UPLOAD') {
      throw new Error('NON_PDF_UPLOAD');
    }
    throw new Error('PDF_UNRECOVERABLE');
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'PDF-only ingestion is enforced on /api/ingest. Upload a valid PDF document.',
          details: 'NON_PDF_REQUEST',
        },
        { status: 422 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('document');
    const supplementalText = String(formData.get('text') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'PDF-only ingestion requires a `document` file field.',
          details: 'MISSING_PDF_FILE',
        },
        { status: 422 }
      );
    }

    const extractedPdfText = await extractFileText(file);
    const documentText = `${extractedPdfText}\n${supplementalText}`.trim();
    if (!documentText) {
      return NextResponse.json(
        {
          error: 'UNPROCESSABLE_DOCUMENT',
          message: 'The PDF was read but did not contain usable text.',
          details: 'EMPTY_PDF_TEXT',
        },
        { status: 422 }
      );
    }

    const audit = runUnifiedForensicAudit(documentText);
    titanLog({
      event: 'forensic_ingest',
      analysisId: audit.analysis_id,
      documentType: audit.document_type,
      status: audit.processing_status,
      latencyMs: Date.now() - startedAt,
      findings: audit.violations.length,
    });

    if (audit.processing_status === 'unprocessable') {
      return NextResponse.json(audit, { status: 422 });
    }

    return NextResponse.json(audit);
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
      if (details === 'PDF_TOO_LARGE') {
        return 'The uploaded PDF exceeds the maximum supported size (20MB).';
      }
      if (details === 'EMPTY_PDF_TEXT') {
        return 'The uploaded PDF did not contain readable text for analysis.';
      }
      if (details === 'PDF_UNRECOVERABLE') {
        return 'Forensic Audit halted after deterministic recovery attempt: PDF remained unreadable or structurally invalid.';
      }
      return 'Forensic Audit halted: document unreadable, encrypted, or structurally invalid.';
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
