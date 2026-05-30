import { NextResponse } from 'next/server';
import { getTitanLogEvents } from '@/lib/titan-log';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ events: getTitanLogEvents() });
  } catch (error) {
    return NextResponse.json({
      events: [],
      degraded: true,
      message: error instanceof Error ? error.message : 'Titan log unavailable.',
    });
  }
}
