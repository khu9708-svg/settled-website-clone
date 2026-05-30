import { Pool } from 'pg'
import {
  buildPlanEntitlements,
  createDefaultSubscriptionSnapshot,
  normalizeCheckoutSourceDomain,
  PlanStatus,
  SettledPlanId,
  SubscriptionSnapshot,
  SubscriptionState,
} from '@/lib/subscription-plans'

const globalForPg = globalThis as unknown as {
  settledPool?: Pool
  settledSubscriptionMemory?: Record<string, MemorySubscriptionSnapshot>
  settledMetricEventsMemory?: MetricEvent[]
  settledPaymentEventMemory?: Record<string, true>
}
const databaseUrl = process.env.DATABASE_URL?.trim()
export const isDatabaseConfigured = Boolean(databaseUrl)
const memorySubscriptions = (globalForPg.settledSubscriptionMemory ||= {})
const memoryMetricEvents = (globalForPg.settledMetricEventsMemory ||= [])
const memoryPaymentEvents = (globalForPg.settledPaymentEventMemory ||= {})

type MetricEvent = {
  id: string
  eventName: string
  userEmail: string | null
  domain: string
  planId: string | null
  analysisId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

type MemorySubscriptionSnapshot = SubscriptionSnapshot & {
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

export const pool =
  globalForPg.settledPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPg.settledPool = pool
}

export async function ensureCaseTables() {
  if (!isDatabaseConfigured) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_cases (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES settled_users(email) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      confidence INTEGER,
      escalation_level TEXT,
      violations JSONB NOT NULL DEFAULT '[]'::jsonb,
      response TEXT NOT NULL,
      source_text TEXT,
      status TEXT NOT NULL DEFAULT 'scanned',
      due_date TIMESTAMPTZ,
      tracking_number TEXT,
      response_notes TEXT,
      outcome TEXT,
      outcome_logged_at TIMESTAMPTZ,
      forensic_trace JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`ALTER TABLE settled_cases ADD COLUMN IF NOT EXISTS outcome TEXT;`)
  await pool.query(`ALTER TABLE settled_cases ADD COLUMN IF NOT EXISTS outcome_logged_at TIMESTAMPTZ;`)
  await pool.query(`ALTER TABLE settled_cases ADD COLUMN IF NOT EXISTS forensic_trace JSONB;`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_rule_outcomes (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      outcome TEXT NOT NULL,
      domain TEXT,
      severity TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS settled_rule_outcomes_rule_idx
    ON settled_rule_outcomes(rule_id, outcome, created_at DESC);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS settled_cases_user_email_updated_idx
    ON settled_cases(user_email, updated_at DESC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_subscription_state (
      user_email TEXT PRIMARY KEY REFERENCES settled_users(email) ON DELETE CASCADE,
      plan_id TEXT NOT NULL DEFAULT 'free',
      plan_status TEXT NOT NULL DEFAULT 'inactive',
      subscription_state TEXT NOT NULL DEFAULT 'none',
      entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      last_checkout_source_domain TEXT NOT NULL DEFAULT 'unknown',
      activated_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_payment_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settled_metric_events (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      user_email TEXT,
      domain TEXT NOT NULL DEFAULT 'unknown',
      plan_id TEXT,
      analysis_id TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS settled_metric_events_name_created_idx
    ON settled_metric_events(event_name, created_at DESC);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS settled_metric_events_user_created_idx
    ON settled_metric_events(user_email, created_at DESC);
  `)
}

export async function logRuleOutcomes({
  caseId,
  violations,
  outcome,
}: {
  caseId: string
  violations: Array<{ rule_id?: string; library_domain?: string; severity?: string }>
  outcome: string
}) {
  if (!isDatabaseConfigured) return
  await ensureCaseTables()
  const ruleViolations = violations.filter((violation) => violation.rule_id)

  for (const violation of ruleViolations) {
    await pool.query(
      `
        INSERT INTO settled_rule_outcomes (id, case_id, rule_id, outcome, domain, severity)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (id) DO UPDATE SET outcome = EXCLUDED.outcome;
      `,
      [
        `${caseId}-${violation.rule_id}-${outcome}`,
        caseId,
        violation.rule_id,
        outcome,
        violation.library_domain || null,
        violation.severity || null,
      ]
    )
  }
}

export async function upsertUser(email: string, name?: string | null) {
  if (!isDatabaseConfigured) return
  await ensureCaseTables()
  await pool.query(
    `
      INSERT INTO settled_users (id, email, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET name = COALESCE(EXCLUDED.name, settled_users.name), updated_at = NOW();
    `,
    [email, email, name || null]
  )
}

export async function getSubscriptionSnapshot(email: string): Promise<SubscriptionSnapshot> {
  const fallback = createDefaultSubscriptionSnapshot()
  if (!email) return fallback

  if (!isDatabaseConfigured) {
    return memorySubscriptions[email] || fallback
  }

  await ensureCaseTables()
  const result = await pool.query(
    `
      SELECT plan_id, plan_status, subscription_state, entitlements, last_checkout_source_domain, activated_at, updated_at
      FROM settled_subscription_state
      WHERE user_email = $1
      LIMIT 1;
    `,
    [email]
  )

  if (!result.rows.length) return fallback
  const row = result.rows[0] as {
    plan_id: SettledPlanId
    plan_status: PlanStatus
    subscription_state: SubscriptionState
    entitlements: Record<string, unknown> | null
    last_checkout_source_domain: string | null
    activated_at: Date | null
    updated_at: Date
  }

  return {
    planId: row.plan_id,
    planStatus: row.plan_status,
    subscriptionState: row.subscription_state,
    entitlements: {
      ...buildPlanEntitlements(row.plan_id),
      ...(row.entitlements || {}),
    },
    checkoutSourceDomain: normalizeCheckoutSourceDomain(row.last_checkout_source_domain),
    activatedAt: row.activated_at ? row.activated_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function upsertSubscriptionSnapshot(input: {
  email: string
  planId: SettledPlanId
  planStatus: PlanStatus
  subscriptionState: SubscriptionState
  entitlements?: Record<string, unknown>
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  checkoutSourceDomain?: string | null
  activatedAt?: string | null
}) {
  if (!input.email) return

  const snapshot: SubscriptionSnapshot = {
    planId: input.planId,
    planStatus: input.planStatus,
    subscriptionState: input.subscriptionState,
    entitlements: {
      ...buildPlanEntitlements(input.planId),
      ...(input.entitlements || {}),
    },
    checkoutSourceDomain: normalizeCheckoutSourceDomain(input.checkoutSourceDomain),
    activatedAt: input.activatedAt || null,
    updatedAt: new Date().toISOString(),
  }

  if (!isDatabaseConfigured) {
    memorySubscriptions[input.email] = {
      ...snapshot,
      stripeCustomerId: input.stripeCustomerId || null,
      stripeSubscriptionId: input.stripeSubscriptionId || null,
    }
    return
  }

  await ensureCaseTables()
  await upsertUser(input.email)
  await pool.query(
    `
      INSERT INTO settled_subscription_state (
        user_email,
        plan_id,
        plan_status,
        subscription_state,
        entitlements,
        stripe_customer_id,
        stripe_subscription_id,
        last_checkout_source_domain,
        activated_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,NOW())
      ON CONFLICT (user_email)
      DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        plan_status = EXCLUDED.plan_status,
        subscription_state = EXCLUDED.subscription_state,
        entitlements = EXCLUDED.entitlements,
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, settled_subscription_state.stripe_customer_id),
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, settled_subscription_state.stripe_subscription_id),
        last_checkout_source_domain = EXCLUDED.last_checkout_source_domain,
        activated_at = COALESCE(EXCLUDED.activated_at, settled_subscription_state.activated_at),
        updated_at = NOW();
    `,
    [
      input.email,
      input.planId,
      input.planStatus,
      input.subscriptionState,
      JSON.stringify(snapshot.entitlements),
      input.stripeCustomerId || null,
      input.stripeSubscriptionId || null,
      snapshot.checkoutSourceDomain,
      input.activatedAt ? new Date(input.activatedAt) : null,
    ]
  )
}

export async function hasBusinessDomainAccess(email: string): Promise<boolean> {
  const snapshot = await getSubscriptionSnapshot(email)
  return Boolean(snapshot.entitlements.businessDomainUnlock && snapshot.planStatus === 'active')
}

export async function markStripeEventProcessed(eventId: string, eventType: string, payload: unknown) {
  if (!eventId) return true
  if (!isDatabaseConfigured) {
    if (memoryPaymentEvents[eventId]) return false
    memoryPaymentEvents[eventId] = true
    return true
  }

  await ensureCaseTables()
  const result = await pool.query(
    `
      INSERT INTO settled_payment_events (event_id, event_type, payload)
      VALUES ($1,$2,$3::jsonb)
      ON CONFLICT (event_id) DO NOTHING;
    `,
    [eventId, eventType, JSON.stringify(payload || {})]
  )
  return (result.rowCount || 0) > 0
}

export async function recordMetricEvent(input: {
  id: string
  eventName: string
  userEmail?: string | null
  domain?: string | null
  planId?: string | null
  analysisId?: string | null
  metadata?: Record<string, unknown>
}) {
  if (!input.id || !input.eventName) return

  const eventRecord: MetricEvent = {
    id: input.id,
    eventName: input.eventName,
    userEmail: input.userEmail || null,
    domain: normalizeCheckoutSourceDomain(input.domain),
    planId: input.planId || null,
    analysisId: input.analysisId || null,
    metadata: input.metadata || {},
    createdAt: new Date().toISOString(),
  }

  if (!isDatabaseConfigured) {
    const existing = memoryMetricEvents.find((event) => event.id === eventRecord.id)
    if (existing) return
    memoryMetricEvents.unshift(eventRecord)
    memoryMetricEvents.splice(500)
    return
  }

  await ensureCaseTables()
  await pool.query(
    `
      INSERT INTO settled_metric_events (id, event_name, user_email, domain, plan_id, analysis_id, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `,
    [
      eventRecord.id,
      eventRecord.eventName,
      eventRecord.userEmail,
      eventRecord.domain,
      eventRecord.planId,
      eventRecord.analysisId,
      JSON.stringify(eventRecord.metadata),
    ]
  )
}

export function getInMemoryMetricEvents() {
  return [...memoryMetricEvents]
}

export async function getLatestMetricEvent(eventName: string, userEmail: string) {
  if (!eventName || !userEmail) return null
  if (!isDatabaseConfigured) {
    return (
      memoryMetricEvents.find((event) => event.eventName === eventName && event.userEmail === userEmail) || null
    )
  }

  await ensureCaseTables()
  const result = await pool.query(
    `
      SELECT id, event_name, user_email, domain, plan_id, analysis_id, metadata, created_at
      FROM settled_metric_events
      WHERE event_name = $1 AND user_email = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [eventName, userEmail]
  )

  if (!result.rows.length) return null
  const row = result.rows[0] as {
    id: string
    event_name: string
    user_email: string | null
    domain: string
    plan_id: string | null
    analysis_id: string | null
    metadata: Record<string, unknown> | null
    created_at: Date
  }
  return {
    id: row.id,
    eventName: row.event_name,
    userEmail: row.user_email,
    domain: row.domain,
    planId: row.plan_id,
    analysisId: row.analysis_id,
    metadata: row.metadata || {},
    createdAt: row.created_at.toISOString(),
  }
}

export async function getMetricsSummary(userEmail?: string | null) {
  const targetEmail = userEmail || null
  if (!isDatabaseConfigured) {
    const events = targetEmail
      ? memoryMetricEvents.filter((event) => event.userEmail === targetEmail)
      : memoryMetricEvents
    return summarizeMetrics(events)
  }

  await ensureCaseTables()
  const result = await pool.query(
    `
      SELECT id, event_name, user_email, domain, plan_id, analysis_id, metadata, created_at
      FROM settled_metric_events
      ${targetEmail ? 'WHERE user_email = $1' : ''}
      ORDER BY created_at DESC
      LIMIT 3000;
    `,
    targetEmail ? [targetEmail] : []
  )

  const events = result.rows.map((row) => ({
    id: row.id as string,
    eventName: row.event_name as string,
    userEmail: (row.user_email as string | null) || null,
    domain: row.domain as string,
    planId: (row.plan_id as string | null) || null,
    analysisId: (row.analysis_id as string | null) || null,
    metadata: (row.metadata as Record<string, unknown> | null) || {},
    createdAt: new Date(row.created_at as Date).toISOString(),
  }))

  return summarizeMetrics(events)
}

export async function findSubscriptionEmailByStripeIdentifiers(input: {
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  const customerId = input.stripeCustomerId || null
  const subscriptionId = input.stripeSubscriptionId || null
  if (!customerId && !subscriptionId) return null

  if (!isDatabaseConfigured) {
    const matched = Object.entries(memorySubscriptions).find(([, snapshot]) => {
      return (
        (customerId && snapshot.stripeCustomerId === customerId) ||
        (subscriptionId && snapshot.stripeSubscriptionId === subscriptionId)
      )
    })
    return matched?.[0] || null
  }

  await ensureCaseTables()
  const result = await pool.query(
    `
      SELECT user_email
      FROM settled_subscription_state
      WHERE ($1::text IS NOT NULL AND stripe_customer_id = $1)
         OR ($2::text IS NOT NULL AND stripe_subscription_id = $2)
      LIMIT 1;
    `,
    [customerId, subscriptionId]
  )
  return (result.rows[0]?.user_email as string | undefined) || null
}

function summarizeMetrics(events: MetricEvent[]) {
  const conversionByDomain: Record<
    string,
    { activated19: number; upgradedTo49: number; upgradedTo99: number; direct49: number; direct99: number }
  > = {}
  let pipelineVelocityCount = 0
  let pipelineVelocityTotalMs = 0
  let retentionProxyCount = 0
  const lastPlanByUser = new Map<string, string>()

  const chronological = [...events].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )

  for (const event of chronological) {
    if (event.eventName === 'subscription.activated') {
      const domain = event.domain || 'unknown'
      conversionByDomain[domain] ||= {
        activated19: 0,
        upgradedTo49: 0,
        upgradedTo99: 0,
        direct49: 0,
        direct99: 0,
      }
      const previousPlan = event.userEmail ? lastPlanByUser.get(event.userEmail) : undefined
      if (event.planId === 'surgical_strike') conversionByDomain[domain].activated19 += 1
      if (event.planId === 'active_pipeline') {
        if (previousPlan === 'surgical_strike') conversionByDomain[domain].upgradedTo49 += 1
        else conversionByDomain[domain].direct49 += 1
      }
      if (event.planId === 'business_engine') {
        if (previousPlan === 'surgical_strike') conversionByDomain[domain].upgradedTo99 += 1
        else conversionByDomain[domain].direct99 += 1
      }
      if (event.userEmail && event.planId) {
        lastPlanByUser.set(event.userEmail, event.planId)
      }

      const velocityMs = Number(event.metadata?.pipelineVelocityMs || 0)
      if (Number.isFinite(velocityMs) && velocityMs > 0) {
        pipelineVelocityCount += 1
        pipelineVelocityTotalMs += velocityMs
      }
    }

    if (event.eventName === 'case.next_step_recorded' || event.eventName === 'case.escalation_ready') {
      retentionProxyCount += 1
    }
  }

  return {
    conversionByDomain,
    pipelineVelocity: {
      samples: pipelineVelocityCount,
      avgMs: pipelineVelocityCount > 0 ? Math.round(pipelineVelocityTotalMs / pipelineVelocityCount) : 0,
    },
    retentionValueProxy: {
      trackedNextStepsAndEscalations: retentionProxyCount,
    },
    eventCount: events.length,
  }
}
