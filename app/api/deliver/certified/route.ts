import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/auth';
import { SERVER_CONFIG } from '@/lib/server-config';

export const runtime = 'nodejs';

interface CertifiedMailRequest {
  recipientName: string;
  recipientStreetAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientZip: string;
  senderName: string;
  senderStreetAddress: string;
  senderCity: string;
  senderState: string;
  senderZip: string;
  pdfBase64: string;
  userEmail: string;
  confirmed?: boolean;
}

interface LobLetterResponse {
  id: string;
  tracking_number: string;
  expected_delivery_date: string;
  status: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidState(value: string) {
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase());
}

function isValidZip(value: string) {
  return /^\d{5}(?:-\d{4})?$/.test(value.trim());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasPdfSignature(base64: string) {
  try {
    const bytes = Buffer.from(base64, 'base64');
    return bytes.subarray(0, 5).equals(Buffer.from('%PDF-'));
  } catch {
    return false;
  }
}

async function sendCertifiedMailViaLob(data: CertifiedMailRequest): Promise<LobLetterResponse> {
  const lobApiKey = process.env.LOB_API_KEY;

  if (!lobApiKey) {
    throw new Error('LOB_API_KEY not configured');
  }

  // Create FormData for Lob API
  const formData = new FormData();

  formData.append('to[name]', data.recipientName);
  formData.append('to[address_line1]', data.recipientStreetAddress);
  formData.append('to[address_city]', data.recipientCity);
  formData.append('to[address_state]', data.recipientState);
  formData.append('to[address_zip]', data.recipientZip);

  formData.append('from[name]', data.senderName);
  formData.append('from[address_line1]', data.senderStreetAddress);
  formData.append('from[address_city]', data.senderCity);
  formData.append('from[address_state]', data.senderState);
  formData.append('from[address_zip]', data.senderZip);

  // PDF file
  const pdfBlob = new Blob([Buffer.from(data.pdfBase64, 'base64')], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'dispute-letter.pdf');

  // Certified mail options
  formData.append('mail_type', 'certified');
  formData.append('color', 'true');

  const response = await fetch('https://api.lob.com/v1/letters', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${lobApiKey}:`).toString('base64')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Lob API error:', error);
    throw new Error(`Lob API error: ${response.status}`);
  }

  const result = (await response.json()) as LobLetterResponse;
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Sign in before sending certified mail so the tracking record stays tied to your case file.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CertifiedMailRequest;

    if (!body.confirmed) {
      return NextResponse.json(
        { error: 'Certified mail halted: review confirmation is required before USPS delivery.' },
        { status: 400 }
      );
    }

    if (body.userEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Certified mail halted: delivery email must match the signed-in account.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (
      !body.recipientName ||
      !body.recipientStreetAddress ||
      !body.recipientCity ||
      !body.recipientState ||
      !body.recipientZip ||
      !body.senderName ||
      !body.senderStreetAddress ||
      !body.senderCity ||
      !body.senderState ||
      !body.senderZip ||
      !body.pdfBase64 ||
      !body.userEmail
    ) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: [
            'recipientName',
            'recipientStreetAddress',
            'recipientCity',
            'recipientState',
            'recipientZip',
            'senderName',
            'senderStreetAddress',
            'senderCity',
            'senderState',
            'senderZip',
            'pdfBase64',
            'userEmail',
          ],
        },
        { status: 400 }
      );
    }
    if (!isValidEmail(body.userEmail)) {
      return NextResponse.json({ error: 'Invalid delivery email format.' }, { status: 422 });
    }
    if (!isValidState(body.recipientState) || !isValidState(body.senderState)) {
      return NextResponse.json({ error: 'State values must be two-letter abbreviations.' }, { status: 422 });
    }
    if (!isValidZip(body.recipientZip) || !isValidZip(body.senderZip)) {
      return NextResponse.json({ error: 'ZIP codes must be 5 digits or ZIP+4.' }, { status: 422 });
    }
    if (!hasPdfSignature(body.pdfBase64)) {
      return NextResponse.json({ error: 'Certified mail requires a valid PDF letter payload.' }, { status: 422 });
    }

    // Send via Lob
    const lobResult = await sendCertifiedMailViaLob(body);

    // Send confirmation email
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: SERVER_CONFIG.emailFrom,
        to: body.userEmail,
        replyTo: SERVER_CONFIG.emailReplyTo,
        subject: 'Dispute Letter Sent via USPS Certified Mail',
        html: `
          <h2>Your Dispute Letter Has Been Mailed</h2>
          <p>Your SETTLED dispute letter has been sent via USPS Certified Mail from your return address to:</p>
          <p>
            <strong>${escapeHtml(body.recipientName)}</strong><br>
            ${escapeHtml(body.recipientStreetAddress)}<br>
            ${escapeHtml(body.recipientCity)}, ${escapeHtml(body.recipientState)} ${escapeHtml(body.recipientZip)}
          </p>
          <p><strong>Return address:</strong></p>
          <p>
            <strong>${escapeHtml(body.senderName)}</strong><br>
            ${escapeHtml(body.senderStreetAddress)}<br>
            ${escapeHtml(body.senderCity)}, ${escapeHtml(body.senderState)} ${escapeHtml(body.senderZip)}
          </p>
          <h3>Tracking Information</h3>
          <p><strong>Tracking Number:</strong> ${lobResult.tracking_number}</p>
          <p><strong>Expected Delivery:</strong> ${lobResult.expected_delivery_date}</p>
          <p><strong>Mail Type:</strong> USPS Certified Mail (signature required)</p>
          <h3>Important</h3>
          <p>Certified mail helps document delivery and makes the investigation timeline easier to track.</p>
          <p>Track your letter: <a href="https://tools.usps.com/">USPS Tracking</a></p>
          <p>Questions? Reply to this email or contact ${SERVER_CONFIG.emailReplyTo}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        trackingNumber: lobResult.tracking_number,
        expectedDelivery: lobResult.expected_delivery_date,
        mailId: lobResult.id,
        status: lobResult.status,
        message: `Your dispute letter has been sent via USPS Certified Mail. Tracking number: ${lobResult.tracking_number}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Certified mail delivery error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send certified mail',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 409 }
    );
  }
}
