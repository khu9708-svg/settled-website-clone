import { NextRequest, NextResponse } from 'next/server';
import { assessPdfQuality } from '@/lib/pdf-quality-gate';

export const runtime = 'nodejs';

type TraceStep = {
  document_fact?: string;
  library_rule_id?: string;
  statutory_basis?: string;
  logical_conclusion?: string;
};

type ForensicTracePayload = {
  trace_id?: string;
  generated_at?: string;
  document_type?: string;
  document_confidence?: number;
  injected_libraries?: string[];
  integrity_note?: string;
  steps?: TraceStep[];
};

function scrubPII(value: unknown): string {
  return String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL_REDACTED]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
    .replace(/\b\d{9}\b/g, '[ID_REDACTED]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REDACTED]')
    .replace(/\b(?:\d[ -]*?){12,19}\b/g, '[ACCOUNT_REDACTED]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function escapePdfText(value: string) {
  return scrubPII(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value: string, width = 88) {
  const lines: string[] = [];
  scrubPII(value)
    .split(/\r?\n/)
    .forEach((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      let line = '';
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (next.length > width) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      lines.push('');
    });
  return lines;
}

function generateTracePdf(trace: ForensicTracePayload) {
  const lines: string[] = [];
  const add = (line = '') => lines.push(line);

  add('SETTLED FORENSIC TRACE');
  add('LEGAL TERMINAL EXPORT - PII SCRUBBED');
  add('');
  add(`TRACE_ID: ${scrubPII(trace.trace_id || 'unknown')}`);
  add(`GENERATED_AT: ${scrubPII(trace.generated_at || new Date().toISOString())}`);
  add(`DOCUMENT_TYPE: ${scrubPII(trace.document_type || 'unknown')}`);
  add(`DOCUMENT_CONFIDENCE: ${trace.document_confidence ?? 0}%`);
  add(`INJECTED_LIBRARIES: ${scrubPII((trace.injected_libraries || []).join(', ') || 'none')}`);
  add('');
  add('INTEGRITY NOTE');
  wrapText(trace.integrity_note || 'Each finding links document evidence to a deterministic rule.').forEach(add);
  add('[DOCUMENT FACT] -> [VIOLATION RULE ID] -> [STATUTORY REFERENCE]');
  add('');

  const steps = Array.isArray(trace.steps) ? trace.steps : [];
  if (!steps.length) add('No trace steps were generated because the document was unprocessable or no rule fired.');

  steps.forEach((step: TraceStep, index: number) => {
    add(`${index + 1}. [DOCUMENT FACT]`);
    wrapText(step.document_fact || 'No fact isolated', 86).forEach(add);
    add(`[VIOLATION RULE ID] ${scrubPII(step.library_rule_id || 'unknown')}`);
    add(`[STATUTORY REFERENCE] ${scrubPII(step.statutory_basis || 'unknown')}`);
    wrapText(`[LOGICAL CONCLUSION] ${step.logical_conclusion || 'unknown'}`, 86).forEach(add);
    add('');
  });

  const pages: string[][] = [[]];
  const maxLinesPerPage = 50;
  lines.forEach((line) => {
    if (pages[pages.length - 1].length >= maxLinesPerPage) pages.push([]);
    pages[pages.length - 1].push(line);
  });

  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const pageIds: number[] = [];

  pages.forEach((pageLines) => {
    const commands = ['BT', '/F1 9 Tf', '42 750 Td', '13 TL'];
    pageLines.forEach((line) => {
      commands.push(`(${escapePdfText(line)}) Tj`, 'T*');
    });
    commands.push('ET');
    const content = commands.join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

function normalizeTraceForRetry(trace: ForensicTracePayload): ForensicTracePayload {
  return {
    trace_id: trace.trace_id || `trace-${Date.now()}`,
    generated_at: trace.generated_at || new Date().toISOString(),
    document_type: trace.document_type || 'unknown',
    document_confidence: typeof trace.document_confidence === 'number' ? trace.document_confidence : 0,
    injected_libraries: Array.isArray(trace.injected_libraries) ? trace.injected_libraries : [],
    integrity_note: trace.integrity_note || 'Deterministic forensic trace output.',
    steps: Array.isArray(trace.steps) ? trace.steps : [],
  };
}

function generateTracePdfWithGate(trace: ForensicTracePayload) {
  let lastQuality = null as ReturnType<typeof assessPdfQuality> | null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const workingTrace = attempt === 1 ? trace : normalizeTraceForRetry(trace);
    const pdf = generateTracePdf(workingTrace);
    const quality = assessPdfQuality(pdf, {
      requiredTokens: ['SETTLED FORENSIC TRACE', 'PII SCRUBBED', '[VIOLATION RULE ID]', '[STATUTORY REFERENCE]'],
      minBytes: 900,
      threshold: 9.5,
    });
    if (quality.passed) {
      return { pdf, quality };
    }
    lastQuality = quality;
  }

  throw new Error(
    `DOCUMENT_QUALITY_UNRECOVERABLE:${JSON.stringify({
      score: lastQuality?.score ?? 0,
      threshold: lastQuality?.threshold ?? 9.5,
      failedRules: (lastQuality?.rules || []).filter((rule) => !rule.passed).map((rule) => rule.rule),
    })}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trace = (body?.forensicTrace || body?.forensic_trace) as ForensicTracePayload | undefined;

    if (!trace || typeof trace !== 'object') {
      return NextResponse.json({ error: 'Missing forensic trace' }, { status: 422 });
    }

    const { pdf, quality } = generateTracePdfWithGate(trace);
    return NextResponse.json({
      filename: `settled-forensic-trace-${scrubPII(trace.trace_id || Date.now())}.pdf`,
      pdfBase64: pdf.toString('base64'),
      quality,
    });
  } catch (error) {
    const details = error instanceof Error ? scrubPII(error.message) : 'Invalid request payload';
    const unrecoverable = details.startsWith('DOCUMENT_QUALITY_UNRECOVERABLE:');
    return NextResponse.json(
      {
        error: unrecoverable ? 'UNRECOVERABLE_TRACE_QUALITY_FAILURE' : 'Unable to generate forensic trace PDF',
        details,
      },
      { status: 422 }
    );
  }
}
