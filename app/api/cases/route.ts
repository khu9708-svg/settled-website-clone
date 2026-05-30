import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/auth'
import { isDatabaseConfigured, pool, upsertUser } from '@/lib/db'

export const runtime = 'nodejs'

interface SettledCaseRow {
  id: string
  type: string
  title: string
  summary: string | null
  confidence: number | null
  escalation_level: string | null
  violations: unknown
  response: string
  source_text: string | null
  status: string
  due_date: Date | null
  tracking_number: string | null
  response_notes: string | null
  outcome: string | null
  outcome_logged_at: Date | null
  forensic_trace: unknown
  created_at: Date
  updated_at: Date
}

function mapCase(row: SettledCaseRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary || '',
    confidence: row.confidence,
    escalationLevel: row.escalation_level,
    violations: row.violations || [],
    response: row.response,
    sourceText: row.source_text || '',
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : undefined,
    trackingNumber: row.tracking_number || '',
    responseNotes: row.response_notes || '',
    outcome: row.outcome || '',
    outcomeLoggedAt: row.outcome_logged_at ? new Date(row.outcome_logged_at).toISOString() : undefined,
    forensicTrace: row.forensic_trace || null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function GET() {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured) {
      return NextResponse.json({
        cases: [],
        degraded: true,
        message: 'Database unavailable. Returning empty account case list.',
      })
    }

    await upsertUser(email, session.user?.name)
    const result = await pool.query(
      `
        SELECT *
        FROM settled_cases
        WHERE user_email = $1
        ORDER BY updated_at DESC
        LIMIT 100;
      `,
      [email]
    )

    return NextResponse.json({ cases: result.rows.map((row) => mapCase(row as SettledCaseRow)) })
  } catch (error) {
    return NextResponse.json({
      cases: [],
      degraded: true,
      message: error instanceof Error ? error.message : 'Case retrieval unavailable',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Sign in to save this case to your dashboard.' }, { status: 401 })
    }

    const body = await request.json()
    const id = body.id || `${body.type || 'case'}-${Date.now()}`
    const now = new Date().toISOString()

    if (!body.type || !body.title || !body.response) {
      return NextResponse.json({ error: 'Missing required case fields.' }, { status: 422 })
    }
    if (!isDatabaseConfigured) {
      return NextResponse.json(
        { success: false, id, degraded: true, message: 'Database unavailable. Save is local-only for now.' },
        { status: 202 }
      )
    }

    await upsertUser(email, session.user?.name)
    await pool.query(
      `
        INSERT INTO settled_cases (
          id, user_email, type, title, summary, confidence, escalation_level,
          violations, response, source_text, status, forensic_trace, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12::jsonb,$13,$13)
        ON CONFLICT (id)
        DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          confidence = EXCLUDED.confidence,
          escalation_level = EXCLUDED.escalation_level,
          violations = EXCLUDED.violations,
          response = EXCLUDED.response,
          source_text = EXCLUDED.source_text,
          forensic_trace = EXCLUDED.forensic_trace,
          updated_at = NOW();
      `,
      [
        id,
        email,
        body.type,
        body.title,
        body.summary || '',
        body.confidence ?? null,
        body.escalationLevel || body.escalation_level || null,
        JSON.stringify(body.violations || []),
        body.response,
        body.sourceText || '',
        body.status || 'scanned',
        JSON.stringify(body.forensicTrace || body.forensic_trace || null),
        now,
      ]
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        degraded: true,
        message: error instanceof Error ? error.message : 'Could not save case.',
      },
      { status: 422 }
    )
  }
}
