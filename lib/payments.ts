import Stripe from 'stripe'
import { PUBLIC_CONFIG } from '@/lib/public-config'
import {
  buildPlanEntitlements,
  ENTITLEMENT_VERSION,
  isPaidPlan,
  normalizeCheckoutSourceDomain,
  PLAN_CATALOG,
} from '@/lib/subscription-plans'

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY_MISSING')
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-05-27.dahlia',
  })
}

export async function createStripeCheckoutSession(input: {
  plan: string
  userEmail?: string
  userId?: string
  sourceDomain?: string
}) {
  if (!isPaidPlan(input.plan)) {
    throw new Error('INVALID_PLAN')
  }

  const plan = PLAN_CATALOG[input.plan]
  const sourceDomain = normalizeCheckoutSourceDomain(input.sourceDomain)
  const entitlements = buildPlanEntitlements(input.plan)
  const stripe = getStripeClient()

  const metadata: Record<string, string> = {
    plan_id: input.plan,
    plan_label: plan.label,
    entitlement_version: ENTITLEMENT_VERSION,
    checkout_source_domain: sourceDomain,
  }

  if (input.userId) metadata.user_id = input.userId
  if (input.userEmail) metadata.user_email = input.userEmail

  const session = await stripe.checkout.sessions.create({
    mode: plan.mode,
    success_url: `${PUBLIC_CONFIG.siteUrl}/dashboard?checkout=success&plan=${plan.planId}`,
    cancel_url: `${PUBLIC_CONFIG.siteUrl}/pricing?checkout=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amountCents,
          product_data: {
            name: plan.label,
            description: plan.description,
          },
          ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
        },
      },
    ],
    metadata,
    ...(input.userEmail ? { customer_email: input.userEmail } : {}),
    ...(plan.mode === 'subscription' ? { subscription_data: { metadata } } : {}),
    ...(plan.mode === 'payment' ? { payment_intent_data: { metadata } } : {}),
  })

  if (!session.url) {
    throw new Error('CHECKOUT_URL_MISSING')
  }

  return {
    url: session.url,
    sessionId: session.id,
    mode: plan.mode,
    planId: input.plan,
    entitlements,
    sourceDomain,
  }
}
