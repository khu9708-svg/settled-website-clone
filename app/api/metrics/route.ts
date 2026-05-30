import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/auth'
import { getMetricsSummary } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Sign in to view your metrics.' },
        { status: 401 }
      )
    }

    const summary = await getMetricsSummary(email)
    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'METRICS_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Metrics unavailable.',
      },
      { status: 422 }
    )
  }
}
