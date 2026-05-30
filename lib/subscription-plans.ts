export type SettledPlanId = 'free' | 'surgical_strike' | 'active_pipeline' | 'business_engine'
export type CheckoutSourceDomain = 'consumer-credit' | 'student-loan' | 'business-credit' | 'unknown'
export type PlanStatus = 'inactive' | 'active' | 'cancelled' | 'past_due'
export type SubscriptionState = 'none' | 'one_time' | 'recurring'

export type PlanEntitlements = {
  studentLoanEngine: boolean
  consumerCreditEngine: boolean
  businessDomainUnlock: boolean
  maxMonthlyScans: number | null
}

export type SubscriptionSnapshot = {
  planId: SettledPlanId
  planStatus: PlanStatus
  subscriptionState: SubscriptionState
  entitlements: PlanEntitlements
  checkoutSourceDomain: CheckoutSourceDomain
  activatedAt: string | null
  updatedAt: string
}

export const ENTITLEMENT_VERSION = '2026-05-30.a1'

export const PLAN_CATALOG: Record<
  Exclude<SettledPlanId, 'free'>,
  {
    planId: Exclude<SettledPlanId, 'free'>
    label: string
    amountCents: number
    currency: 'usd'
    mode: 'payment' | 'subscription'
    interval?: 'month'
    description: string
  }
> = {
  surgical_strike: {
    planId: 'surgical_strike',
    label: 'Surgical Strike',
    amountCents: 1900,
    currency: 'usd',
    mode: 'payment',
    description: 'One-time analysis and dispute package',
  },
  active_pipeline: {
    planId: 'active_pipeline',
    label: 'Active Pipeline',
    amountCents: 4900,
    currency: 'usd',
    mode: 'subscription',
    interval: 'month',
    description: 'Ongoing dispute automation and case tracking',
  },
  business_engine: {
    planId: 'business_engine',
    label: 'Business Engine',
    amountCents: 9900,
    currency: 'usd',
    mode: 'subscription',
    interval: 'month',
    description: 'Business credit engine with advanced dispute operations',
  },
}

export function isPaidPlan(value: string): value is Exclude<SettledPlanId, 'free'> {
  return value === 'surgical_strike' || value === 'active_pipeline' || value === 'business_engine'
}

export function normalizeCheckoutSourceDomain(value: unknown): CheckoutSourceDomain {
  const domain = String(value || '')
    .trim()
    .toLowerCase()
  if (domain === 'consumer-credit' || domain === 'student-loan' || domain === 'business-credit') {
    return domain
  }
  return 'unknown'
}

export function buildPlanEntitlements(planId: SettledPlanId): PlanEntitlements {
  if (planId === 'surgical_strike') {
    return {
      studentLoanEngine: true,
      consumerCreditEngine: true,
      businessDomainUnlock: false,
      maxMonthlyScans: 1,
    }
  }

  if (planId === 'active_pipeline') {
    return {
      studentLoanEngine: true,
      consumerCreditEngine: true,
      businessDomainUnlock: false,
      maxMonthlyScans: null,
    }
  }

  if (planId === 'business_engine') {
    return {
      studentLoanEngine: true,
      consumerCreditEngine: true,
      businessDomainUnlock: true,
      maxMonthlyScans: null,
    }
  }

  return {
    studentLoanEngine: false,
    consumerCreditEngine: false,
    businessDomainUnlock: false,
    maxMonthlyScans: 0,
  }
}

export function createDefaultSubscriptionSnapshot(): SubscriptionSnapshot {
  return {
    planId: 'free',
    planStatus: 'inactive',
    subscriptionState: 'none',
    entitlements: buildPlanEntitlements('free'),
    checkoutSourceDomain: 'unknown',
    activatedAt: null,
    updatedAt: new Date(0).toISOString(),
  }
}

export function mapPlanToDashboardTier(planId: SettledPlanId): 'free' | 'tactical' | 'active' | 'enterprise' {
  if (planId === 'surgical_strike') return 'tactical'
  if (planId === 'active_pipeline') return 'active'
  if (planId === 'business_engine') return 'enterprise'
  return 'free'
}
