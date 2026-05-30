import { Pool } from 'pg'

const globalForPg = globalThis as unknown as {
  settledPool?: Pool
}
const databaseUrl = process.env.DATABASE_URL?.trim()
export const isDatabaseConfigured = Boolean(databaseUrl)

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
