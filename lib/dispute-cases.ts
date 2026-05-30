export type DisputeCaseType = 'student-loans' | 'disputes' | 'business'

export type DisputeCaseStatus =
  | 'scanned'
  | 'reviewed'
  | 'pdf_ready'
  | 'certified_sent'
  | 'waiting'
  | 'response_received'
  | 'escalation_ready'
  | 'closed'

export interface DisputeViolation {
  item?: string
  statute?: string
  severity?: string
  description?: string
  account_detail?: string
  rule_id?: string
  library_domain?: string
  evidence?: string
  recommended_action?: string
}

export interface DisputeCase {
  id: string
  type: DisputeCaseType
  title: string
  summary: string
  confidence?: number
  escalationLevel?: string
  violations: DisputeViolation[]
  response: string
  sourceText?: string
  status: DisputeCaseStatus
  createdAt: string
  updatedAt: string
  dueDate?: string
  trackingNumber?: string
  responseNotes?: string
  outcome?: 'deleted' | 'verified' | 'in_progress' | ''
  outcomeLoggedAt?: string
  forensicTrace?: unknown
}

export const CASE_STORAGE_KEY = 'settled.disputeCases.v1'

export const caseTypeLabels: Record<DisputeCaseType, string> = {
  'student-loans': 'Student Loan',
  disputes: 'Credit & Collections',
  business: 'Business Credit',
}

export const statusLabels: Record<DisputeCaseStatus, string> = {
  scanned: 'Scanned',
  reviewed: 'Reviewed',
  pdf_ready: 'PDF Ready',
  certified_sent: 'Certified Sent',
  waiting: '30-Day Clock',
  response_received: 'Response Received',
  escalation_ready: 'Escalation Ready',
  closed: 'Closed',
}

export const statusOrder: DisputeCaseStatus[] = [
  'scanned',
  'reviewed',
  'pdf_ready',
  'certified_sent',
  'waiting',
  'response_received',
  'escalation_ready',
  'closed',
]

export function loadDisputeCases(): DisputeCase[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDisputeCases(cases: DisputeCase[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(cases))
}

export function upsertDisputeCase(nextCase: DisputeCase) {
  const existing = loadDisputeCases()
  const withoutDuplicate = existing.filter((item) => item.id !== nextCase.id)
  saveDisputeCases([nextCase, ...withoutDuplicate].slice(0, 25))
}

export async function saveDisputeCase(nextCase: DisputeCase) {
  const response = await fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextCase),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    if (response.status === 401) {
      upsertDisputeCase(nextCase)
      throw new Error(data.error || 'Sign in to save this case to your account. A local copy was saved in this browser.')
    }
    throw new Error(data.error || 'Could not save this case.')
  }

  const data = await response.json().catch(() => ({}))
  if (data?.success === false) {
    upsertDisputeCase(nextCase)
    throw new Error(data.message || 'Saved locally. Account sync is temporarily unavailable.')
  }
  return data
}

export function makeCaseTitle(type: DisputeCaseType, violations: DisputeViolation[], fallbackSummary?: string) {
  const firstViolation = violations[0]?.item?.trim()
  if (firstViolation) return firstViolation
  if (fallbackSummary) return fallbackSummary.slice(0, 88)
  return `${caseTypeLabels[type]} scan`
}

export function calculateDueDate(startDate = new Date()) {
  const due = new Date(startDate)
  due.setDate(due.getDate() + 30)
  return due.toISOString()
}
