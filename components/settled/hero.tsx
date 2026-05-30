"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { postEngineScan, validateEngineUpload } from "@/lib/engine-client"

const modules = [
  {
    code: "01",
    label: "STUDENT LOAN AUDIT",
    href: "/student-loans",
    detail: "MOHELA / Navient / Aidvantage / COVID forbearance / PSLF / IDR",
    active: true,
  },
  {
    code: "02",
    label: "CREDIT FILE AUDIT",
    href: "/disputes",
    detail: "Collections / balances / dates / validation / bureau errors",
  },
  {
    code: "03",
    label: "BUSINESS FILE AUDIT",
    href: "/business",
    detail: "D&B / PAYDEX / vendor tradelines / business bureau records",
  },
  {
    code: "04",
    label: "CERTIFIED MAIL",
    href: "/pricing",
    detail: "Delivery evidence / response dates / escalation record",
  },
]

type AnalysisResult = {
  violations?: Array<{ item?: string; statute?: string; severity?: string; description?: string }>
  confidence?: number
  response?: string
  summary?: string
  error?: string
}

export function Hero() {
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([">_ AWAITING DOCUMENT UPLOAD"])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canScan = useMemo(() => fileName.length > 0, [fileName])

  async function handleFile(file?: File) {
    if (!file) return
    const uploadError = validateEngineUpload(file)
    if (uploadError) {
      setFileName("")
      setError(uploadError)
      return
    }
    setFileName(file.name)
    setError("")
    setLogs([`>_ DOCUMENT RECEIVED: ${file.name}`, ">_ READY FOR UNIFIED TRIAGE"])
  }

  async function runScan() {
    if (!canScan || loading) return
    if (!fileInputRef.current?.files?.[0]) {
      setError("Upload a PDF to continue. /api/ingest is strict PDF-only.")
      return
    }
    setLoading(true)
    document.documentElement.dataset.focusMode = "true"
    setError("")
    setResult(null)
    setLogs([
      ">_ TRIAGE_AGENT: CLASSIFYING_DOMAIN",
      ">_ RULE_INJECTION: LOADING_STATUTORY_LIBRARY",
      ">_ DETERMINISTIC_CORE: MATCHING_DOCUMENT_FACTS",
    ])

    try {
      const formData = new FormData()
      if (fileInputRef.current?.files?.[0]) formData.append("document", fileInputRef.current.files[0])
      if (text.trim()) formData.append("text", text.trim())
      const data = (await postEngineScan("/api/ingest", formData)) as AnalysisResult

      setResult(data)
      setLogs((current) => [
        ...current,
        `>_ COMPILED: ${data.violations?.length || 0}_POSSIBLE_ISSUES`,
        `>_ CONFIDENCE: ${data.confidence || "REVIEW"}%`,
        ">_ OUTPUT_READY: DISPUTE_LETTER",
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed"
      setError(message)
      setLogs((current) => [...current, ">_ OUTPUT_ERROR: MANUAL_REVIEW_REQUIRED"])
    } finally {
      delete document.documentElement.dataset.focusMode
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-[0.05]"
        src="/videos/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.9)_47%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_28%,rgba(37,99,235,0.18),transparent_25%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1200px] gap-8 px-4 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <aside className="order-2 grid gap-2 lg:order-1">
          {modules.map((module) => (
            <a
              key={module.code}
              href={module.href}
              className={`group grid grid-cols-[44px_1fr] gap-4 border px-4 py-4 transition ${
                module.active
                  ? "border-[#2563EB]/55 bg-[#2563EB]/10"
                  : "border-white/[0.09] bg-white/[0.018] hover:border-white/22 hover:bg-white/[0.035]"
              }`}
            >
              <span className="text-sm font-bold tracking-[0.18em] text-[#7BA4FF]">{module.code}</span>
              <span>
                <span className="block text-[15px] font-bold uppercase tracking-[0.08em] text-white">{module.label}</span>
                <span className="mt-1 block text-sm font-medium leading-relaxed text-white/52">{module.detail}</span>
              </span>
            </a>
          ))}
        </aside>

        <div className="order-1 lg:order-2">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#7BA4FF]">Forensic Dispute Command</p>
            <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/35 sm:block">System Online</p>
          </div>

          <h1 className="max-w-3xl text-pretty text-[clamp(3rem,6vw,6rem)] font-semibold uppercase leading-[0.87] text-white">
            Scan student loan reporting errors before they keep costing you.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-[1.55] text-white/68">
            Upload a PDF or paste account details. SETTLED checks for possible reporting problems, cites the issue, and
            generates a document-specific dispute letter. Factual debts are not disputed.
          </p>

          <div className="mt-8 border border-white/12 bg-[#030303]/90 shadow-[0_34px_120px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Input Terminal</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Student Loan Engine</p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.92fr]">
              <div className="border-white/10 p-4 lg:border-r">
                <textarea
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value)
                    setError("")
                    if (event.target.value.trim().length > 8) {
                      setLogs([">_ SUPPLEMENTAL_TEXT_RECEIVED", ">_ READY FOR PDF-AUGMENTED AUDIT"])
                    }
                  }}
                  placeholder="Optional: paste supplemental context (account dates, balance notes, or reporting details) to include with the uploaded PDF..."
                  className="min-h-[178px] w-full resize-none bg-transparent text-base font-semibold leading-relaxed text-white outline-none placeholder:text-white/32"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 rounded-none border-white/14 bg-transparent px-5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-white/[0.06]"
                  >
                    Upload PDF
                  </Button>
                  <Button
                    type="button"
                    disabled={!canScan || loading}
                    onClick={runScan}
                    className="h-11 rounded-none bg-[#2563EB] px-5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2563EB]/90 disabled:opacity-45"
                  >
                    {loading ? "Auditing" : "Run Audit"}
                  </Button>
                </div>
                {fileName ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-[#7BA4FF]">{fileName}</p> : null}
                {error ? <p className="mt-3 border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">{error}</p> : null}
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-white/42">
                  /api/ingest accepts PDF uploads only.
                </p>
              </div>

              <div className="p-4">
                <div className="min-h-[178px] space-y-2 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-white/66">
                  {logs.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {result ? (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">Audit Output</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-white/62">
                      {result.summary || result.violations?.[0]?.item || "Document-specific result compiled."}
                    </p>
                    <a href="/student-loans" className="mt-4 inline-flex text-sm font-bold uppercase tracking-[0.08em] text-[#7BA4FF] hover:text-white">
                      Open full student loan workspace
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
