import { NextResponse } from 'next/server';
import { pool, ensureCaseTables, isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!isDatabaseConfigured) {
      return NextResponse.json({ rules: [], degraded: true, message: 'Database unavailable.' });
    }
    await ensureCaseTables();

    const result = await pool.query(`
      SELECT
        rule_id,
        domain,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE outcome = 'deleted')::int AS deleted,
        COUNT(*) FILTER (WHERE outcome = 'verified')::int AS verified,
        COUNT(*) FILTER (WHERE outcome = 'in_progress')::int AS in_progress,
        CASE
          WHEN COUNT(*) >= 5
            AND COUNT(*) FILTER (WHERE outcome = 'verified')::float / COUNT(*) >= 0.6
          THEN true
          ELSE false
        END AS needs_manual_review
      FROM settled_rule_outcomes
      GROUP BY rule_id, domain
      ORDER BY needs_manual_review DESC, total DESC;
    `);

    return NextResponse.json({ rules: result.rows });
  } catch (error) {
    return NextResponse.json({
      rules: [],
      degraded: true,
      message: error instanceof Error ? error.message : 'Rule outcomes unavailable.',
    });
  }
}
