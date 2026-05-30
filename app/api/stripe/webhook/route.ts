import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PUBLIC_CONFIG } from '@/lib/public-config';
import { SERVER_CONFIG } from '@/lib/server-config';

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(key, {
    apiVersion: '2026-05-27.dahlia',
  });
}

interface CheckoutSessionCompletedEvent {
  type: 'checkout.session.completed';
  data: {
    object: {
      id: string;
      customer_email: string;
      metadata: {
        plan: string;
        userId: string;
      };
    };
  };
}

interface InvoicePaymentSucceededEvent {
  type: 'invoice.payment_succeeded';
  data: {
    object: {
      customer_email: string;
      subscription: string;
    };
  };
}

interface SubscriptionDeletedEvent {
  type: 'customer.subscription.deleted';
  data: {
    object: {
      customer_email: string;
    };
  };
}

type StripeEvent = CheckoutSessionCompletedEvent | InvoicePaymentSucceededEvent | SubscriptionDeletedEvent;

// In-memory store for user subscriptions (replace with database)
const userSubscriptions: Record<
  string,
  {
    email: string;
    plan: string;
    status: string;
    stripeCustomerId?: string;
    subscriptionId?: string;
  }
> = {};

function getUserByEmail(email: string) {
  return Object.entries(userSubscriptions).find((entry) => entry[1].email === email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 422 });
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Webhook signature verification failed:', errorMessage);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email || '';
      const plan = (session.metadata?.plan as string) || 'active_pipeline';

      console.log(`Checkout completed for ${email} - Plan: ${plan}`);

      // Update user subscription
      const timestamp = Date.now().toString();
      userSubscriptions[timestamp] = {
        email,
        plan,
        status: 'active',
        stripeCustomerId: session.customer as string,
        subscriptionId: session.subscription as string,
      };

      // Send welcome email
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const planNames: Record<string, string> = {
          surgical_strike: 'Surgical Strike',
          active_pipeline: 'Active Pipeline',
          business_engine: 'Business Engine',
        };

        const planFeatures: Record<string, string[]> = {
          surgical_strike: ['1 document scan', '3 dispute letters', 'PDF download', 'Email delivery', 'Certified mail available'],
          active_pipeline: [
            'Unlimited document scans',
            'Unlimited dispute letters',
            'All delivery options',
            'Priority support',
          ],
          business_engine: [
            'Everything in Active Pipeline',
            'Business credit engine',
            'Unlimited client management',
            'API access',
            'Dedicated support',
          ],
        };

        const planName = planNames[plan] || plan;
        const features = planFeatures[plan] || [];

        await resend.emails.send({
          from: SERVER_CONFIG.emailFrom,
          to: email,
          replyTo: SERVER_CONFIG.emailReplyTo,
          subject: `Welcome to SETTLED — Your ${planName} Account Is Active`,
          html: `
            <h2>Welcome to SETTLED</h2>
            <p>Your <strong>${planName}</strong> plan is now active. Here's what you have access to:</p>
            <ul>
              ${features.map((f) => `<li>${f}</li>`).join('')}
            </ul>
            <p><a href="${PUBLIC_CONFIG.siteUrl}/dashboard" style="background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Go to Your Dashboard</a></p>
            <p>Questions? Contact us at ${SERVER_CONFIG.emailReplyTo}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Handle invoice.payment_succeeded (recurring subscriptions)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const email = invoice.customer_email || '';

      console.log(`Payment succeeded for ${email}`);

      const user = getUserByEmail(email);
      if (user) {
        user[1].status = 'active';
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(`Subscription deleted for customer ${customerId}`);

      // Find and downgrade user
      Object.values(userSubscriptions).forEach((user) => {
        if (user.stripeCustomerId === customerId) {
          user.status = 'cancelled';
          user.plan = 'cancelled';
        }
      });

      // Send cancellation email
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const user = Object.entries(userSubscriptions).find(
          (entry) => entry[1].stripeCustomerId === customerId
        )?.[1];
        if (user?.email) {
          await resend.emails.send({
            from: SERVER_CONFIG.emailFrom,
            to: user.email,
            replyTo: SERVER_CONFIG.emailReplyTo,
            subject: 'Your SETTLED Subscription Has Been Cancelled',
            html: `
              <h2>Subscription Cancelled</h2>
              <p>Your SETTLED subscription has been cancelled. You now have access to our free tier with limited scans.</p>
              <p>If you'd like to reactivate your plan or have questions, please reply to this email or contact ${SERVER_CONFIG.emailReplyTo}</p>
            `,
          });
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 422 }
    );
  }
}

export { userSubscriptions };
