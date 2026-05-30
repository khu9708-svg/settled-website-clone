'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, ShieldCheck, Truck } from 'lucide-react';

interface DeliveryOptionsProps {
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
}

export function DeliveryOptions({
  violations,
  response,
  summary,
  userEmail,
  userName,
}: DeliveryOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientStreetAddress: '',
    recipientCity: '',
    recipientState: '',
    recipientZip: '',
    senderName: userName || '',
    senderStreetAddress: '',
    senderCity: '',
    senderState: '',
    senderZip: '',
  });
  const [confirmMessage, setConfirmMessage] = useState('');

  const certifiedReady =
    reviewed &&
    formData.recipientName &&
    formData.recipientStreetAddress &&
    formData.recipientCity &&
    formData.recipientState &&
    formData.recipientZip &&
    formData.senderName &&
    formData.senderStreetAddress &&
    formData.senderCity &&
    formData.senderState &&
    formData.senderZip;

  const base64ToBytes = (base64: string) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  };

  // Step 1: Generate PDF (used by all options)
  const generatePDF = async (sendEmail = false) => {
    if (pdfBase64 && !sendEmail) return pdfBase64; // Already generated

    setLoading(true);
    try {
      const pdfResponse = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violations,
          response,
          summary,
          userEmail,
          userName,
          sendEmail,
        }),
      });

      const data = await pdfResponse.json().catch(() => ({}));
      if (!pdfResponse.ok) {
        throw new Error(data.error || data.message || 'Failed to generate PDF');
      }
      if (data.pdfBase64) {
        setPdfBase64(data.pdfBase64);
        return data.pdfBase64;
      }
      throw new Error('PDF payload was empty');
    } catch (error) {
      setConfirmMessage(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Option 1: Download PDF
  const handleDownloadPDF = async () => {
    const pdf = await generatePDF();
    if (!pdf) return;

    const blobData = base64ToBytes(pdf);
    const blob = new Blob([blobData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SETTLED-Dispute-Letter-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setConfirmMessage('PDF downloaded. Review it before sending.');
  };

  // Option 2: Email PDF
  const handleEmailPDF = async () => {
    const pdf = await generatePDF(true);
    if (!pdf) return;

    setConfirmMessage(`Dispute letter emailed to ${userEmail}. Review the copy before sending.`);
  };

  // Option 3: Send Certified Mail
  const handleCertifiedMail = async () => {
    const pdf = await generatePDF();
    if (!pdf) return;

    setLoading(true);
    try {
      const certifiedResponse = await fetch('/api/deliver/certified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pdfBase64: pdf,
          userEmail,
          confirmed: reviewed,
        }),
      });

      const data = await certifiedResponse.json().catch(() => ({}));
      if (data.success) {
        setConfirmMessage(
          `Dispute letter sent via USPS Certified Mail\nTracking: ${data.trackingNumber}\nExpected delivery: ${data.expectedDelivery}\nKeep this record with your dispute file.`
        );
        setShowAddressForm(false);
      } else {
        setConfirmMessage(data.error || data.message || (certifiedResponse.ok ? 'Failed to send certified mail' : 'Certified mail request rejected.'));
      }
    } catch (error: unknown) {
      setConfirmMessage(error instanceof Error ? error.message : 'Failed to send certified mail');
    } finally {
      setLoading(false);
    }
  };

  if (confirmMessage) {
    return (
      <div className="settled-panel rounded-xl p-6">
        <div className="text-center">
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-green-300">{confirmMessage}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setConfirmMessage('');
              setShowAddressForm(false);
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="settled-panel rounded-xl p-6">
        <div className="mb-6 flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-[#7BA4FF]" />
          <div>
            <h3 className="text-xl font-semibold text-white">Build the paper trail</h3>
            <p className="mt-1 text-sm font-bold leading-relaxed text-white/70">
              Review the letter first. Then download it, email yourself a copy, or send it by certified mail when you
              need a dated delivery record.
            </p>
          </div>
        </div>

        {!showAddressForm ? (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Option 1 */}
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="settled-paper rounded-lg p-4 text-left transition hover:border-[#7BA4FF]/40 disabled:opacity-50"
            >
              <Download className="h-6 w-6 mb-3 text-settled-blue" />
              <h4 className="mb-2 text-sm font-semibold text-white">Download PDF</h4>
              <p className="text-xs font-medium leading-relaxed text-white/60">
                Save the letter and review every fact before sending.
              </p>
              <Button className="mt-4 w-full bg-settled-blue text-xs font-semibold text-white hover:bg-settled-blue/90">
                Download Now
              </Button>
            </button>

            {/* Option 2 */}
            <button
              onClick={handleEmailPDF}
              disabled={loading}
              className="settled-paper rounded-lg p-4 text-left transition hover:border-[#7BA4FF]/40 disabled:opacity-50"
            >
              <Mail className="h-6 w-6 mb-3 text-settled-green" />
              <h4 className="mb-2 text-sm font-semibold text-white">Email PDF</h4>
              <p className="text-xs font-medium leading-relaxed text-white/60">
                Send a copy to {userEmail} for your records.
              </p>
              <Button className="mt-4 w-full bg-settled-green text-xs font-semibold text-white hover:bg-settled-green/90">
                Email Letter
              </Button>
            </button>

            {/* Option 3 */}
            <button
              onClick={() => setShowAddressForm(true)}
              disabled={loading}
              className="settled-paper rounded-lg p-4 text-left transition hover:border-[#7BA4FF]/40 disabled:opacity-50"
            >
              <Truck className="h-6 w-6 mb-3 text-settled-purple" />
              <h4 className="mb-2 text-sm font-semibold text-white">Certified Mail</h4>
              <p className="text-xs font-medium leading-relaxed text-white/60">
                Mail from your return address to the bureau, servicer, collector, or furnisher.
              </p>
              <Button className="mt-4 w-full bg-settled-purple text-xs font-semibold text-white hover:bg-settled-purple/90">
                Send Certified
              </Button>
            </button>
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            <div>
              <h4 className="text-base font-semibold text-white">Certified Mail Details</h4>
              <p className="mt-1 text-xs font-medium leading-relaxed text-white/55">
                Enter the address exactly as you want it mailed. SETTLED does not verify bureau or servicer mailing
                addresses for you.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <h5 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7BA4FF]">Recipient</h5>
              <input
                type="text"
                placeholder="Bureau, servicer, collector, or furnisher name"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="settled-input mb-3 w-full rounded-lg px-3 py-3 text-sm"
              />
              <input
                type="text"
                placeholder="Recipient street address"
                value={formData.recipientStreetAddress}
                onChange={(e) => setFormData({ ...formData, recipientStreetAddress: e.target.value })}
                className="settled-input mb-3 w-full rounded-lg px-3 py-3 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.recipientCity}
                  onChange={(e) => setFormData({ ...formData, recipientCity: e.target.value })}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.recipientState}
                  onChange={(e) => setFormData({ ...formData, recipientState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={formData.recipientZip}
                  onChange={(e) => setFormData({ ...formData, recipientZip: e.target.value })}
                  maxLength={10}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <h5 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7BA4FF]">Your Return Address</h5>
              <input
                type="text"
                placeholder="Your full legal name"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="settled-input mb-3 w-full rounded-lg px-3 py-3 text-sm"
              />
              <input
                type="text"
                placeholder="Your street address"
                value={formData.senderStreetAddress}
                onChange={(e) => setFormData({ ...formData, senderStreetAddress: e.target.value })}
                className="settled-input mb-3 w-full rounded-lg px-3 py-3 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.senderCity}
                  onChange={(e) => setFormData({ ...formData, senderCity: e.target.value })}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.senderState}
                  onChange={(e) => setFormData({ ...formData, senderState: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={formData.senderZip}
                  onChange={(e) => setFormData({ ...formData, senderZip: e.target.value })}
                  maxLength={10}
                  className="settled-input rounded-lg px-3 py-3 text-sm"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs font-medium leading-relaxed text-white/70">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I reviewed the letter and addresses. I understand SETTLED is not a law firm and does not guarantee an
                investigation result, deletion, settlement, or score change.
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCertifiedMail}
                disabled={loading || !certifiedReady}
                className="flex-1 bg-settled-purple hover:bg-settled-purple/90"
              >
                {loading ? 'Sending...' : 'Send via USPS'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddressForm(false)}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center p-4 rounded border border-border/50">
        <p>
          <strong>Important:</strong> The credit bureau has 30 days to investigate after receiving
          your dispute. Keep tracking documentation for your records.
        </p>
      </div>
    </div>
  );
}
