import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SERVER_CONFIG } from '@/lib/server-config';
import { assessPdfQuality } from '@/lib/pdf-quality-gate';

interface PDFRequest {
  violations: Array<{
    item: string;
    statute: string;
    severity: string;
    description: string;
    account_detail: string;
  }>;
  response: string;
  summary: string;
  userEmail: string;
  userName?: string;
  sendEmail?: boolean;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(value: string): string {
  return value
    .replace(/§/g, 'Section ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function escapePdfText(value: string): string {
  return cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value: string, width = 92): string[] {
  const lines: string[] = [];

  cleanText(value)
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

function generatePDFBuffer(data: PDFRequest): Buffer {
  const pages: string[][] = [[]];
  const maxLinesPerPage = 47;

  const addLine = (line = '') => {
    const current = pages[pages.length - 1];
    if (current.length >= maxLinesPerPage) {
      pages.push([]);
    }
    pages[pages.length - 1].push(line);
  };

  addLine('SETTLED');
  addLine('Dispute Intelligence System');
  addLine('');
  addLine('FEDERAL DISPUTE LETTER');
  addLine(`Generated: ${new Date().toLocaleDateString()}`);
  addLine('');
  addLine('VIOLATIONS IDENTIFIED');
  data.violations.forEach((v) => {
    addLine(`- ${v.item}`);
    wrapText(`Statute: ${v.statute}`, 86).forEach(addLine);
  });
  addLine('');
  addLine('LETTER');
  wrapText(data.response, 92).forEach(addLine);
  addLine('');
  addLine('SETTLED is not a law firm and does not provide legal advice.');
  addLine('Review this letter for factual accuracy before sending.');

  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds: number[] = [];

  pages.forEach((pageLines, index) => {
    const commands = ['BT', '/F1 10 Tf', '50 750 Td', '14 TL'];

    pageLines.forEach((line, lineIndex) => {
      if (index === 0 && lineIndex === 0) {
        commands.push('/F1 22 Tf', `(${escapePdfText(line)}) Tj`, '/F1 10 Tf', 'T*');
      } else {
        commands.push(`(${escapePdfText(line)}) Tj`, 'T*');
      }
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
  const offsets: number[] = [0];

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

function normalizePdfRequestForRetry(data: PDFRequest): PDFRequest {
  return {
    ...data,
    summary: cleanText(data.summary || '').slice(0, 600),
    response: cleanText(data.response || '').slice(0, 15000),
    violations: (Array.isArray(data.violations) ? data.violations : []).map((violation) => ({
      item: cleanText(violation.item || 'Unspecified issue'),
      statute: cleanText(violation.statute || 'Statutory basis unavailable'),
      severity: cleanText(violation.severity || 'unknown'),
      description: cleanText(violation.description || ''),
      account_detail: cleanText(violation.account_detail || ''),
    })),
  };
}

function generatePdfWithGate(data: PDFRequest) {
  let lastQuality = null as ReturnType<typeof assessPdfQuality> | null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const workingData = attempt === 1 ? data : normalizePdfRequestForRetry(data);
    const pdfBuffer = generatePDFBuffer(workingData);
    const quality = assessPdfQuality(pdfBuffer, {
      requiredTokens: ['SETTLED', 'FEDERAL DISPUTE LETTER', 'VIOLATIONS IDENTIFIED', 'SETTLED is not a law firm'],
      minBytes: 900,
      threshold: 9.5,
    });
    if (quality.passed) {
      return { pdfBuffer, quality };
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

async function emailPDF(email: string, pdfBuffer: Buffer): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: SERVER_CONFIG.emailFrom,
      to: email,
      replyTo: SERVER_CONFIG.emailReplyTo,
      subject: 'Your SETTLED Dispute Letter Is Ready',
      html: `
        <h2>Your Custom Dispute Letter</h2>
        <p>Your SETTLED dispute letter is attached. This letter has been generated specifically for your violations and cites the exact federal statutes that apply to your situation.</p>
        <p><strong>Next steps:</strong></p>
        <ol>
          <li>Print the attached PDF</li>
          <li>Sign the letter</li>
          <li>Mail it to the credit bureau, or use the Certified Mail workflow when you need tracking documentation</li>
        </ol>
        <p>Questions? Reply to this email or contact us at ${SERVER_CONFIG.emailReplyTo}</p>
      `,
      attachments: [
        {
          filename: 'SETTLED-Dispute-Letter.pdf',
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf',
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PDFRequest;

    if (!body.response || !Array.isArray(body.violations) || !body.userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: response, violations, userEmail' },
        { status: 422 }
      );
    }
    if (!isValidEmail(body.userEmail)) {
      return NextResponse.json({ error: 'Invalid userEmail format' }, { status: 422 });
    }

    const { pdfBuffer, quality } = generatePdfWithGate(body);

    const emailSent = body.sendEmail ? await emailPDF(body.userEmail, pdfBuffer) : false;

    return NextResponse.json(
      {
        success: true,
        pdfGenerated: true,
        emailSent,
        pdfBase64: pdfBuffer.toString('base64'),
        quality,
        message: body.sendEmail ? 'PDF generated and emailed successfully' : 'PDF generated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PDF generation error:', error);
    const details = error instanceof Error ? error.message : String(error)
    const unrecoverable = details.startsWith('DOCUMENT_QUALITY_UNRECOVERABLE:')
    return NextResponse.json(
      {
        error: unrecoverable ? 'UNRECOVERABLE_PDF_QUALITY_FAILURE' : 'PDF generation failed',
        details,
      },
      { status: 422 }
    );
  }
}
