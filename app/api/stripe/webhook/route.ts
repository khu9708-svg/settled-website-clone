import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PUBLIC_CONFIG } from '@/lib/public-config'
import { SERVER_CONFIG } from '@/lib/server-config'
import {
  findSubscriptionEmailByStripeIdentifiers,
  getLatestMetricEvent,
  getSubscriptionSnapshot,
  markStripeEventProcessed,
  recordMetricEvent,
  upsertSubscriptionSnapshot,
  upsertUser,
} from '@/lib/db'
import { isPaidPlan, normalizeCheckoutSourceDomain } from '@/lib/subscription-plans'

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY_MISSING')
  }
  return new Stripe(key, {
    apiVersion: '2026-05-27.dahlia',
  })
}

function extractEmailFromCheckoutSession(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email?.trim()
  const metadataEmail = session.metadata?.user_email?.trim()
  const customerDetailsEmail = session.customer_details?.email?.trim()
  return customerEmail || metadataEmail || customerDetailsEmail || ''
}

async function sendPlanEmail(email: string, planLabel: string) {
  if (!email || !process.env.RESEND_API_KEY) return
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: SERVER_CONFIG.emailFrom,
      to: email,
      replyTo: SERVER_CONFIG.emailReplyTo,
      subject: `SETTLED ${planLabel} plan is active`,
      html: `
        <h2>Your SETTLED plan is active</h2>
        <p>Plan: <strong>${planLabel}</strong></p>
        <p>Your account entitlements were updated immediately after payment confirmation.</p>
        <p><a href="${PUBLIC_CONFIG.siteUrl}/dashboard" style="background:#2563EB;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open Dashboard</a></p>
      `,
    })
  } catch (error) {
    console.error('WEBHOOK_EMAIL_FAILURE', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
    if (!webhookSecret) {
      return NextResponse.json({ error: 'WEBHOOK_SECRET_MISSING' }, { status: 422 })
    }

    const body = await request.text()
    let event: Stripe.Event
    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'INVALID_SIGNATURE',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      )
    }

    const shouldProcess = await markStripeEventProcessed(event.id, event.type, event.data?.object)
    if (!shouldProcess) {
      return NextResponse.json({ received: true, deduplicated: true }, { status: 200 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const email = extractEmailFromCheckoutSession(session)
      const rawPlan = String(session.metadata?.plan_id || session.metadata?.plan || '').trim()
      const sourceDomain = normalizeCheckoutSourceDomain(session.metadata?.checkout_source_domain)
      const mode = session.mode === 'subscription' ? 'recurring' : 'one_time'

      if (!email || !isPaidPlan(rawPlan)) {
        return NextResponse.json(
          {
            received: true,
            skipped: true,
            reason: 'CHECKOUT_MISSING_EMAIL_OR_PLAN',
          },
          { status: 200 }
        )
      }

      await upsertUser(email)
      await upsertSubscriptionSnapshot({
        email,
        planId: rawPlan,
        planStatus: 'active',
        subscriptionState: mode,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        checkoutSourceDomain: sourceDomain,
        activatedAt: new Date().toISOString(),
      })

      const latestAudit = await getLatestMetricEvent('forensic.audit_completed', email)
      const pipelineVelocityMs = latestAudit
        ? Math.max(0, Date.now() - new Date(latestAudit.createdAt).getTime())
        : 0

      await recordMetricEvent({
        id: `subscription_activated:${event.id}`,
        eventName: 'subscription.activated',
        userEmail: email,
        domain: sourceDomain,
        planId: rawPlan,
        analysisId: latestAudit?.analysisId || null,
        metadata: {
          stripeEventId: event.id,
          stripeSessionId: session.id,
          pipelineVelocityMs,
          checkoutMode: mode,
        },
      })

      await sendPlanEmail(email, rawPlan.replace(/_/g, ' ').toUpperCase())
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const email = invoice.customer_email?.trim() || ''
      const invoiceSubscriptionId =
        ((invoice as unknown as { subscription?: string | null }).subscription as string | null) || null
      if (email) {
        const snapshot = await getSubscriptionSnapshot(email)
        await upsertSubscriptionSnapshot({
          email,
          planId: snapshot.planId,
          planStatus: 'active',
          subscriptionState: snapshot.subscriptionState,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          stripeSubscriptionId: invoiceSubscriptionId,
          checkoutSourceDomain: snapshot.checkoutSourceDomain,
          activatedAt: snapshot.activatedAt || new Date().toISOString(),
        })
        await recordMetricEvent({
          id: `invoice_payment_succeeded:${event.id}`,
          eventName: 'subscription.renewed',
          userEmail: email,
          domain: snapshot.checkoutSourceDomain,
          planId: snapshot.planId,
          metadata: {
            stripeEventId: event.id,
            invoiceId: invoice.id,
          },
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const email = await findSubscriptionEmailByStripeIdentifiers({
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
        stripeSubscriptionId: subscription.id,
      })

      if (email) {
        const snapshot = await getSubscriptionSnapshot(email)
        await upsertSubscriptionSnapshot({
          email,
          planId: snapshot.planId,
          planStatus: 'cancelled',
          subscriptionState: snapshot.subscriptionState,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null,
          stripeSubscriptionId: subscription.id,
          checkoutSourceDomain: snapshot.checkoutSourceDomain,
          activatedAt: snapshot.activatedAt,
        })
        await recordMetricEvent({
          id: `subscription_cancelled:${event.id}`,
          eventName: 'subscription.cancelled',
          userEmail: email,
          domain: snapshot.checkoutSourceDomain,
          planId: snapshot.planId,
          metadata: {
            stripeEventId: event.id,
          },
        })
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'WEBHOOK_PROCESSING_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 422 }
    )
  }
}
