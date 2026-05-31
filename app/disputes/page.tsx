'use client'

import { useState } from 'react'
import { Header } from '@/components/settled/header'
import { Footer } from '@/components/settled/footer'
import { DeliveryOptions } from '@/components/settled/delivery-options'
import { postEngineScan, validateEngineUpload } from '@/lib/engine-client'
import { makeCaseTitle, saveDisputeCase } from '@/lib/dispute-cases'
import { useForensicOperator } from '@/lib/use-forensic-operator'

const reviewItems = [
  'Collections, charge-offs, late payments, repossessions, and closed accounts that do not match your records',
  'Duplicate accounts, wrong balances, wrong dates, re-aged debt, or incorrect date of first delinquency',
  'Accounts that appear after identity theft, fraud, mixed files, or unauthorized activity',
  'Bureau differences between Equifax, Experian, and TransUnion on the same account',
  'Furnisher responses, bureau investigation results, and proof that an item was previously disputed',
]

export default function DisputesPage() {
  const forensicOperator = useForensicOperator()
  const [pastedText, setPastedText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deliveryEmail, setDeliveryEmail] = useState('')
  const hasInput = Boolean(uploadedFile) || pastedText.trim().length > 0

  const copyLetter = async () => {
    if (!result?.response) return
    await navigator.clipboard.writeText(result.response)
    setNotice('Dispute letter copied. Review it carefully before sending.')
  }

  const downloadLetter = () => {
    if (!result?.response) return
    const blob = new Blob([result.response], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'settled-credit-dispute-letter.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const saveToDashboard = async () => {
    if (!result?.response) return
    const now = new Date().toISOString()
    try {
      await saveDisputeCase({
      id: `${result.legacy_case_type || 'disputes'}-${Date.now()}`,
      type: result.legacy_case_type || 'disputes',
      title: makeCaseTitle(result.legacy_case_type || 'disputes', result.violations || [], result.summary),
      summary: result.summary || 'Credit dispute scan saved from SETTLED.',
      confidence: result.confidence,
      escalationLevel: result.escalation_level,
      violations: result.violations || [],
      response: result.response,
      sourceText: pastedText,
      status: 'scanned',
      forensicTrace: result.forensic_trace,
      createdAt: now,
      updatedAt: now,
    })
      setNotice('Saved to your account dashboard. Your case file is ready to track.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Saved locally. Sign in to sync this case to your account.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadError = validateEngineUpload(file)
    if (uploadError) {
      setUploadedFile(null)
      setError(uploadError)
      e.target.value = ''
      return
    }

    setError('')
    setUploadedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasInput) {
      setError('Upload a supported file (.pdf, .doc, .docx) or paste account text to continue.')
      return
    }

    setLoading(true)
    document.documentElement.dataset.focusMode = 'true'
    setError('')
    setNotice('')
    setResult(null)

    try {
      const formData = new FormData()
      if (uploadedFile) formData.append('document', uploadedFile)
      if (pastedText.trim()) formData.append('text', pastedText.trim())
      formData.append('domain_hint', 'consumer-credit')

      const data = await postEngineScan('/api/ingest', formData)

      if (data.message || data.banner) {
        setNotice(data.message || data.banner)
      }

      if (data.redirect && !data.response) {
        setError('')
        setResult(null)
        setLoading(false)
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Analysis error. Please try again.')
    } finally {
      delete document.documentElement.dataset.focusMode
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto max-w-[1200px] px-4 py-16 lg:py-20">
        <div className="mb-10 max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">
            Credit & Collections Engine
          </p>
          <h1 className="mt-5 text-pretty text-4xl font-semibold uppercase leading-[0.92] text-white lg:text-6xl">
            Find credit report errors before they cost you the next approval.
          </h1>
          <p
            className="mt-6 max-w-4xl text-xl font-semibold leading-[1.58] text-white md:text-2xl"
            style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
          >
            Upload a credit report, collection notice, or bureau response. SETTLED checks for possible FCRA reporting
            problems and generates a document-specific dispute letter you can review before sending.
          </p>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-relaxed text-[#AFC8FF]">
            You are not overreacting — credit reporting errors are real, and there is a practical, step-by-step way to address them.
          </p>
        </div>

        <div className="mb-10 divide-y divide-white/10 border border-white/12 bg-[#030303]">
          {reviewItems.map((item, index) => (
            <div
              key={item}
              className="grid gap-3 px-5 py-4 text-base font-semibold leading-[1.45] text-white md:grid-cols-[56px_1fr]"
              style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
            >
              <span className="text-sm font-bold tracking-[0.18em] text-[#7BA4FF]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
          {/* Form Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Upload or paste the account details
              </h2>
              <p className="settled-tech mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7BA4FF]">
                Forensic Profile: {forensicOperator}
              </p>
              <p
                className="mt-4 text-lg font-semibold leading-[1.55] text-white md:text-xl"
                style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
              >
                Best documents: full three-bureau credit report, collection notice, creditor statement, identity theft
                report, payoff record, settlement letter, or bureau investigation response.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                  Upload Document
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="settled-input w-full rounded-xl px-4 py-4 text-base focus:outline-none focus:border-[#2563EB] file:mr-4 file:rounded-md file:border-0 file:bg-[#2563EB] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  {uploadedFile && (
                    <p className="mt-2 text-xs text-[#7BA4FF]">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-xs text-white/40">or</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              {/* Paste Text */}
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                  Paste Report Text (No File Required)
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value)
                    setError('')
                    setNotice('')
                  }}
                  placeholder="Paste credit-report text directly, or combine pasted details with an uploaded file..."
                  className="settled-input h-52 w-full rounded-xl p-5 text-base leading-relaxed focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !hasInput}
                className="settled-tech w-full h-auto rounded-xl bg-[#2563EB] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(37,99,235,0.28)] transition-colors hover:bg-[#2563EB]/90 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Start My Credit Analysis'}
              </button>
              <p className="text-sm font-medium leading-relaxed text-white/50">
                Use this engine only for information you believe is inaccurate or incomplete. SETTLED does not help
                users dispute factual debts simply because they are inconvenient.
              </p>
              <p className="text-sm font-medium leading-relaxed text-white/55">
                For your safety, keep sensitive files in secure upload only. SETTLED provides educational reporting support, not legal advice or guaranteed outcomes.
              </p>
            </form>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 p-5 text-[#AFC8FF] text-sm">
                {notice}
              </div>
            )}
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {Array.isArray(result.warnings) && result.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5">
                  <p className="settled-tech text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
                    Forensic Intake Warnings
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.warnings.map((warning: string) => (
                      <li key={warning} className="text-sm font-medium leading-relaxed text-amber-100/90">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.summary && (
                <div className="settled-paper rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7BA4FF]">
                    Summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{result.summary}</p>
                </div>
              )}

              {/* Violations */}
              {result.violations && result.violations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-white">Violations Found</h2>
                  {result.violations.map((v: any, i: number) => (
                    <div key={i} className="settled-paper rounded-xl p-5">
                      <p className="text-base font-semibold leading-snug text-white">{v.item}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-white/55">Statute: {v.statute}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/55">Severity: {v.severity}</p>
                      {v.description && (
                        <p className="mt-3 text-sm font-medium leading-relaxed text-white/72">{v.description}</p>
                      )}
                      {v.account_detail && (
                        <p className="mt-2 text-xs leading-relaxed text-white/50">
                          Account Detail: {v.account_detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Confidence Score */}
              {result.confidence && (
                <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 p-5">
                  <p className="text-sm text-white/80">
                    <span className="font-semibold">Confidence Score:</span> {result.confidence}%
                  </p>
                  <p className="text-sm text-white/80">
                    <span className="font-semibold">Escalation Level:</span> {result.escalation_level}
                  </p>
                </div>
              )}

              {/* Dispute Letter */}
              {result.response && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-white">Dispute Letter</h2>
                    <p className="settled-tech text-[11px] font-bold uppercase tracking-[0.16em] text-[#7BA4FF]">
                      Operator: {forensicOperator}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyLetter}
                        className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Copy Letter
                      </button>
                      <button
                        type="button"
                        onClick={downloadLetter}
                        className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2563EB]/90"
                      >
                        Download TXT
                      </button>
                      <button
                        type="button"
                        onClick={saveToDashboard}
                        className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90"
                      >
                        Save Case
                      </button>
                    </div>
                  </div>
                  <div className="settled-paper rounded-xl p-5 overflow-visible">
                    <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-white/86">
                      {result.response}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-100/85">
                    Review every date, bureau, account number, and fact before sending. SETTLED is not a law firm and
                    does not provide legal advice.
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <label className="block text-sm font-bold text-white">Email for PDF and delivery options</label>
                    <input
                      type="email"
                      value={deliveryEmail}
                      onChange={(event) => setDeliveryEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                    />
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/50">
                      Used to send the generated PDF and certified mail tracking updates.
                    </p>
                  </div>
                  {deliveryEmail && (
                    <DeliveryOptions
                      violations={result.violations || []}
                      response={result.response}
                      summary={result.summary || ''}
                      userEmail={deliveryEmail}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
