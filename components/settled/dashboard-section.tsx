"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CalendarClock, Copy, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  calculateDueDate,
  caseTypeLabels,
  DisputeCase,
  DisputeCaseStatus,
  loadDisputeCases,
  saveDisputeCases,
  statusLabels,
  statusOrder,
} from "@/lib/dispute-cases"
import { supportMailtoHref } from "@/lib/public-config"

interface DashboardUser {
  email: string
  plan: "free" | "tactical" | "active" | "enterprise"
  disputesUsed: number
  lettersGenerated: number
  nextBillingDate?: string
}

interface DashboardSectionProps {
  user: DashboardUser
}

const planInfo = {
  free: { name: "Free Review", price: "$0", note: "One preview scan" },
  tactical: { name: "Surgical Strike", price: "$19", note: "One focused document scan" },
  active: { name: "Active Pipeline", price: "$49/month", note: "Ongoing dispute support" },
  enterprise: { name: "Business Engine", price: "$99/month", note: "Business bureau support" },
}

const caseDesks = [
  {
    title: "Student loan record",
    body: "MOHELA, Navient, Aidvantage, Nelnet, COVID forbearance, transfer errors, duplicate balances.",
    href: "/student-loans",
    image: "/images/settled-human-hero.png",
    cta: "Scan Student Loans",
  },
  {
    title: "Credit or collection file",
    body: "Collections, charge-offs, late payments, identity theft, balances, and bureau reporting differences.",
    href: "/disputes",
    image: "/images/settled-case-desk.png",
    cta: "Fix Credit Errors",
  },
  {
    title: "Business credit file",
    body: "D&B, Experian Business, Equifax Business, vendor tradelines, UCC records, and funding credibility.",
    href: "/business",
    image: "/images/settled-business-human.png",
    cta: "Scan Business Credit",
  },
]

const nextSteps = [
  "Upload or paste the clearest document first.",
  "Review the possible reporting issue and statute references.",
  "Confirm every bureau, account number, date, balance, and fact.",
  "Copy or download the letter, then document delivery and responses.",
]

const outcomeOptions = [
  { value: 'deleted', label: 'Deleted' },
  { value: 'verified', label: 'Verified' },
  { value: 'in_progress', label: 'In Progress' },
] as const

export function DashboardSection({ user }: DashboardSectionProps) {
  const currentPlan = planInfo[user.plan]
  const [cases, setCases] = useState<DisputeCase[]>([])
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [syncNotice, setSyncNotice] = useState('')
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch('/api/cases')
        if (!response.ok) throw new Error('Database cases unavailable')
        const data = await response.json()
        const dbCases = data.cases || []
        setCases(dbCases)
        setActiveCaseId(dbCases[0]?.id || null)
        setSyncNotice(
          data.degraded
            ? data.message || 'Database unavailable. Showing locally saved case data when available.'
            : 'Cases are synced to your account.'
        )
      } catch {
        const loaded = loadDisputeCases()
        setCases(loaded)
        setActiveCaseId(loaded[0]?.id || null)
        setSyncNotice('Showing local browser cases. Sign in to sync cases to your account.')
      }
    }

    loadCases()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.focusMode = focusMode ? 'true' : 'false'
    return () => {
      delete document.documentElement.dataset.focusMode
    }
  }, [focusMode])

  const persistCases = (nextCases: DisputeCase[]) => {
    setCases(nextCases)
    saveDisputeCases(nextCases)
  }

  const updateCase = async (caseId: string, updates: Partial<DisputeCase>) => {
    const nextCases = cases.map((item) =>
      item.id === caseId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    )
    persistCases(nextCases)

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.success === false) {
        setSyncNotice(data.message || 'Saved locally. Reconnect or sign in again to sync account changes.')
      }
    } catch {
      setSyncNotice('Saved locally. Reconnect or sign in again to sync account changes.')
    }
  }

  const deleteCase = async (caseId: string) => {
    const nextCases = cases.filter((item) => item.id !== caseId)
    persistCases(nextCases)
    if (activeCaseId === caseId) setActiveCaseId(nextCases[0]?.id || null)

    try {
      const response = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.success === false) {
        setSyncNotice(data.message || 'Removed locally. Reconnect or sign in again to sync account changes.')
      }
    } catch {
      setSyncNotice('Removed locally. Reconnect or sign in again to sync account changes.')
    }
  }

  const markStatus = (item: DisputeCase, status: DisputeCaseStatus) => {
    updateCase(item.id, {
      status,
      dueDate: status === 'waiting' && !item.dueDate ? calculateDueDate() : item.dueDate,
    })
  }

  const activeCase = cases.find((item) => item.id === activeCaseId) || cases[0]
  const openCases = cases.filter((item) => item.status !== 'closed').length
  const dueCases = cases.filter((item) => item.dueDate && new Date(item.dueDate) <= new Date()).length
  const savedLetters = cases.filter((item) => item.response).length

  const copyLetter = async (item: DisputeCase) => {
    await navigator.clipboard.writeText(item.response)
    setCopied(item.id)
    window.setTimeout(() => setCopied(''), 2000)
  }

  const downloadTrace = async (item: DisputeCase) => {
    if (!item.forensicTrace) return
    const response = await fetch('/api/generate/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forensicTrace: item.forensicTrace }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.pdfBase64) {
      setSyncNotice(data.error || data.message || 'Trace export failed. Try again from the saved case file.')
      return
    }

    const binary = window.atob(data.pdfBase64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = data.filename || 'settled-forensic-trace.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="settled-panel relative overflow-hidden rounded-xl p-6 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7BA4FF]/70 to-transparent" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Dispute Command Center</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] text-white lg:text-5xl">
              Track the case after the letter is generated.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/72">
              SETTLED is strongest when every scan becomes a file: facts found, letter saved, delivery documented,
              deadline watched, response reviewed, and escalation prepared only when the record supports it.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="settled-paper rounded-lg p-4">
              <p className="text-3xl font-semibold text-white">{openCases}</p>
              <p className="mt-1 text-xs font-semibold text-white/52">Open cases</p>
            </div>
            <div className="settled-paper rounded-lg p-4">
              <p className="text-3xl font-semibold text-white">{savedLetters}</p>
              <p className="mt-1 text-xs font-semibold text-white/52">Saved letters</p>
            </div>
            <div className="settled-paper rounded-lg p-4">
              <p className="text-3xl font-semibold text-white">{dueCases}</p>
              <p className="mt-1 text-xs font-semibold text-white/52">Due now</p>
            </div>
          </div>
        </div>
        {syncNotice && (
          <p className="mt-5 text-xs font-bold text-white/45">{syncNotice}</p>
        )}
        <button
          type="button"
          onClick={() => setFocusMode((value) => !value)}
          className="mt-5 rounded-md border border-[#2563EB]/60 bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#7BA4FF]"
        >
          Focus Mode: {focusMode ? 'On' : 'Off'}
        </button>
      </div>

      {cases.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            {cases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCaseId(item.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  activeCase?.id === item.id
                    ? "border-[#7BA4FF]/70 bg-[#071126]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7BA4FF]">
                      {caseTypeLabels[item.type]}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-white">{item.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold text-white/60">
                    {statusLabels[item.status]}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs font-medium leading-relaxed text-white/50">{item.summary}</p>
                {item.dueDate && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-100/80">
                    <CalendarClock className="size-3.5" />
                    Response window date: {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>

          {activeCase && (
            <div className="rounded-lg border border-white/10 bg-[#050505] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">
                    {caseTypeLabels[activeCase.type]} File
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{activeCase.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/60">{activeCase.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-400/30 bg-transparent text-red-100 hover:bg-red-500/10"
                  onClick={() => deleteCase(activeCase.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-white/45">Confidence</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{activeCase.confidence || 0}%</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-white/45">Violations</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{activeCase.violations.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold text-white/45">Escalation</p>
                  <p className="mt-1 text-lg font-semibold text-white">{activeCase.escalationLevel || 'Review'}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-white">Case status</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {statusOrder.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => markStatus(activeCase, status)}
                      className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                        activeCase.status === status
                          ? "border-[#7BA4FF]/70 bg-[#2563EB] text-white"
                          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-white">Outcome log</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {outcomeOptions.map((outcome) => (
                    <button
                      key={outcome.value}
                      type="button"
                      onClick={() => updateCase(activeCase.id, { outcome: outcome.value })}
                      className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                        activeCase.outcome === outcome.value
                          ? "border-[#7BA4FF]/70 bg-[#2563EB] text-white"
                          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {outcome.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-medium text-white/45">
                  Outcomes feed rule-level review metrics so repeated verified/no-deletion patterns can be flagged.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Tracking number</span>
                  <input
                    value={activeCase.trackingNumber || ''}
                    onChange={(event) => updateCase(activeCase.id, { trackingNumber: event.target.value })}
                    placeholder="USPS tracking number"
                    className="mt-2 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">30-day response date</span>
                  <input
                    type="date"
                    value={activeCase.dueDate ? activeCase.dueDate.slice(0, 10) : ''}
                    onChange={(event) => {
                      const value = event.target.value ? new Date(`${event.target.value}T12:00:00`).toISOString() : undefined
                      updateCase(activeCase.id, { dueDate: value })
                    }}
                    className="mt-2 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Response notes</span>
                <textarea
                  value={activeCase.responseNotes || ''}
                  onChange={(event) => updateCase(activeCase.id, { responseNotes: event.target.value })}
                  placeholder="Paste the bureau, servicer, collector, or business bureau response here. Next version can scan this response for round 2 or CFPB escalation."
                  className="mt-2 h-28 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/35"
                />
              </label>

              <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FileText className="size-4 text-[#7BA4FF]" />
                    Saved dispute letter
                  </p>
                  <Button
                    type="button"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => copyLetter(activeCase)}
                  >
                    <Copy className="mr-2 size-4" />
                    {copied === activeCase.id ? 'Copied' : 'Copy Letter'}
                  </Button>
                </div>
                <div className="mt-4 max-h-56 overflow-y-auto rounded border border-white/10 bg-black/50 p-3">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">{activeCase.response}</p>
                </div>
              </div>

              {activeCase.forensicTrace ? (
                <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FileText className="size-4 text-[#7BA4FF]" />
                    Forensic trace
                  </p>
                  <Button
                    type="button"
                    className="mt-3 bg-white text-black hover:bg-white/90"
                    onClick={() => downloadTrace(activeCase)}
                  >
                    Download Trace PDF
                  </Button>
                  <div className="mt-4 max-h-56 overflow-y-auto rounded border border-white/10 bg-black/50 p-3">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">
                      {JSON.stringify(activeCase.forensicTrace, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {cases.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <p className="text-lg font-semibold text-white">No saved case files yet.</p>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-white/55">
            Run an engine, generate a letter, then hit Save Case. The dashboard will turn that scan into a trackable
            dispute file.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {caseDesks.map((item) => (
          <a
            key={item.href}
            href={item.href}
              className="group relative min-h-[380px] overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.38)]"
            >
            <Image src={item.image} alt="" fill className="object-cover opacity-62 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-76" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/35" />
            <div className="relative flex h-full min-h-[380px] flex-col justify-end p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Case Desk</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-bold leading-relaxed text-white/78">{item.body}</p>
              <div className="mt-6 inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">
                {item.cta}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="settled-panel relative overflow-hidden rounded-xl p-6 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Human Review Path</p>
          <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white">
            Your dashboard should feel like a case file, not a generic app.
          </h3>
          <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/72">
            SETTLED keeps the work practical: what document was scanned, what letter was generated, what was sent, and
            what response needs attention next.
          </p>
          <div className="mt-7 grid gap-3">
            {nextSteps.map((step, index) => (
              <div key={step} className="settled-paper flex gap-4 rounded-lg p-4">
                <span className="text-sm font-semibold text-[#7BA4FF]">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-sm font-medium leading-relaxed text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
          <Image src="/images/settled-case-desk.png" alt="" fill className="object-cover opacity-56" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/72 to-black/35" />
          <div className="relative flex min-h-[420px] flex-col justify-between p-6 lg:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Current Plan</p>
              <h3 className="mt-4 text-3xl font-semibold text-white">{currentPlan.name}</h3>
              <p className="mt-1 text-xl font-semibold text-white">{currentPlan.price}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/65">{currentPlan.note}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/60 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Case Activity</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-3xl font-semibold text-white">{user.disputesUsed}</p>
                  <p className="text-xs font-bold text-white/50">Scans used</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">{user.lettersGenerated}</p>
                  <p className="text-xs font-bold text-white/50">Letters generated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[#2563EB]/25 bg-[#071126] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Need help reading a result?</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-white/55">
            Support can help you understand the workflow boundaries. SETTLED does not provide legal advice.
          </p>
        </div>
        <Button asChild className="bg-[#2563EB] text-white hover:bg-[#2563EB]/90">
          <a href={supportMailtoHref()}>Contact Support</a>
        </Button>
      </div>
    </div>
  )
}
