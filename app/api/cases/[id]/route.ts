import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/auth'
import { isDatabaseConfigured, logRuleOutcomes, pool, recordMetricEvent, upsertUser } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isDatabaseConfigured) {
      return NextResponse.json(
        { success: false, degraded: true, message: 'Database unavailable. Changes remain local in this browser.' },
        { status: 202 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    await upsertUser(email, session.user?.name)

    const existingResult = await pool.query(
      `SELECT type, status, response_notes, tracking_number FROM settled_cases WHERE id = $1 AND user_email = $2 LIMIT 1;`,
      [id, email]
    )
    const existing = existingResult.rows[0] as
      | {
          type: string
          status: string
          response_notes: string | null
          tracking_number: string | null
        }
      | undefined

    await pool.query(
      `
        UPDATE settled_cases
        SET
          status = COALESCE($3, status),
          tracking_number = COALESCE($4, tracking_number),
          due_date = $5,
          response_notes = COALESCE($6, response_notes),
          outcome = COALESCE($7, outcome),
          outcome_logged_at = CASE WHEN $7::text IS NULL THEN outcome_logged_at ELSE NOW() END,
          updated_at = NOW()
        WHERE id = $1 AND user_email = $2;
      `,
      [
        id,
        email,
        body.status || null,
        body.trackingNumber ?? null,
        body.dueDate ? new Date(body.dueDate) : null,
        body.responseNotes ?? null,
        body.outcome ?? null,
      ]
    )

    if (body.outcome) {
      const result = await pool.query(
        'SELECT violations FROM settled_cases WHERE id = $1 AND user_email = $2;',
        [id, email]
      )
      await logRuleOutcomes({
        caseId: id,
        violations: result.rows[0]?.violations || [],
        outcome: body.outcome,
      })
    }

    const domainFromType =
      existing?.type === 'business'
        ? 'business-credit'
        : existing?.type === 'student-loans'
          ? 'student-loan'
          : 'consumer-credit'

    if (
      (body.status && body.status !== existing?.status) ||
      (typeof body.responseNotes === 'string' && body.responseNotes !== (existing?.response_notes || '')) ||
      (typeof body.trackingNumber === 'string' && body.trackingNumber !== (existing?.tracking_number || ''))
    ) {
      await recordMetricEvent({
        id: `case_next_step:${id}:${Date.now()}`,
        eventName: 'case.next_step_recorded',
        userEmail: email,
        domain: domainFromType,
        metadata: {
          caseId: id,
          status: body.status || existing?.status || null,
          trackingNumberProvided: Boolean(body.trackingNumber),
          responseNotesLength: typeof body.responseNotes === 'string' ? body.responseNotes.length : 0,
        },
      })
    }

    if (body.status === 'escalation_ready' && body.status !== existing?.status) {
      await recordMetricEvent({
        id: `case_escalation:${id}:${Date.now()}`,
        eventName: 'case.escalation_ready',
        userEmail: email,
        domain: domainFromType,
        metadata: {
          caseId: id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unable to update case.' },
      { status: 422 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isDatabaseConfigured) {
      return NextResponse.json(
        { success: false, degraded: true, message: 'Database unavailable. Remove is local-only for now.' },
        { status: 202 }
      )
    }

    const { id } = await context.params
    await upsertUser(email, session.user?.name)
    await pool.query('DELETE FROM settled_cases WHERE id = $1 AND user_email = $2;', [id, email])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unable to remove case.' },
      { status: 422 }
    )
  }
}
