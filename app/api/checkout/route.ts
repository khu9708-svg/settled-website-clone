import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_CONFIG } from '@/lib/public-config';

const STRIPE_PRODUCTS: Record<
  CheckoutRequest['plan'],
  {
    name: string;
    amount: number;
    currency: string;
    type: 'one_time' | 'recurring';
    interval?: 'month';
    description: string;
  }
> = {
  surgical_strike: {
    name: 'Surgical Strike',
    amount: 1900,
    currency: 'usd',
    type: 'one_time',
    description: 'One-time analysis and dispute package',
  },
  active_pipeline: {
    name: 'Active Pipeline',
    amount: 4900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    description: 'Ongoing dispute automation',
  },
  business_engine: {
    name: 'Business Engine',
    amount: 9900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    description: 'High-volume dispute infrastructure',
  },
};

interface CheckoutRequest {
  plan: 'surgical_strike' | 'active_pipeline' | 'business_engine';
  email?: string;
  userId?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const { plan, email, userId } = body;

    if (!plan || !STRIPE_PRODUCTS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const product = STRIPE_PRODUCTS[plan];
    const siteUrl = PUBLIC_CONFIG.siteUrl;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 422 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 422 });
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': product.currency,
        'line_items[0][price_data][unit_amount]': product.amount.toString(),
        'line_items[0][price_data][product_data][name]': product.name,
        'line_items[0][price_data][product_data][description]':
          product.description,
        'line_items[0][quantity]': '1',
        mode: product.type === 'one_time' ? 'payment' : 'subscription',
        success_url: `${siteUrl}/dashboard`,
        cancel_url: `${siteUrl}/pricing`,
        'metadata[plan]': plan,
        ...(product.type === 'recurring' && product.interval
          ? { 'line_items[0][price_data][recurring][interval]': product.interval }
          : {}),
        ...(userId && { 'metadata[userId]': userId }),
        ...(email && { 'customer_email': email }),
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe error:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 409 }
      );
    }

    const session = await response.json();
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 422 }
    );
  }
}
