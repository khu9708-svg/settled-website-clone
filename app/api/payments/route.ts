import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/auth'
import { createStripeCheckoutSession } from '@/lib/payments'
import { getMetricsSummary, getSubscriptionSnapshot, recordMetricEvent, upsertUser } from '@/lib/db'
import { isPaidPlan, normalizeCheckoutSourceDomain, PLAN_CATALOG } from '@/lib/subscription-plans'

export const runtime = 'nodejs'

type CheckoutRequest = {
  plan?: string
  sourceDomain?: string
}

export async function GET() {
  try {
    const session = await auth()
    const email = session?.user?.email || null

    const subscription = email ? await getSubscriptionSnapshot(email) : null
    const metrics = email ? await getMetricsSummary(email) : null

    return NextResponse.json({
      plans: PLAN_CATALOG,
      subscription,
      metrics,
      authenticated: Boolean(email),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'PAYMENTS_STATUS_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Payments status unavailable.',
      },
      { status: 422 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest
    const plan = String(body.plan || '').trim()
    const sourceDomain = normalizeCheckoutSourceDomain(body.sourceDomain)

    if (!isPaidPlan(plan)) {
      return NextResponse.json(
        { error: 'INVALID_PLAN', message: 'Select a valid plan tier before checkout.' },
        { status: 422 }
      )
    }

    const session = await auth()
    const email = session?.user?.email || null
    const userId = email || null

    if (!email || !userId) {
      return NextResponse.json(
        {
          error: 'AUTH_REQUIRED',
          message: 'Sign in before checkout so subscription access can be provisioned immediately.',
        },
        { status: 401 }
      )
    }

    await upsertUser(email, session?.user?.name)
    await recordMetricEvent({
      id: `checkout_start:${userId}:${plan}:${Date.now()}`,
      eventName: 'checkout.started',
      userEmail: email,
      domain: sourceDomain,
      planId: plan,
      metadata: {
        source: 'pricing_terminal',
      },
    })

    const checkout = await createStripeCheckoutSession({
      plan,
      userEmail: email,
      userId,
      sourceDomain,
    })

    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.sessionId,
      planId: checkout.planId,
      entitlements: checkout.entitlements,
      sourceDomain: checkout.sourceDomain,
    })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    const message =
      details === 'STRIPE_SECRET_KEY_MISSING'
        ? 'Stripe configuration is missing on the server.'
        : details === 'CHECKOUT_URL_MISSING'
          ? 'Stripe checkout could not return a redirect URL.'
          : 'Checkout session could not be created.'

    return NextResponse.json(
      {
        error: 'CHECKOUT_FAILED',
        message,
        details,
      },
      { status: 422 }
    )
  }
}
