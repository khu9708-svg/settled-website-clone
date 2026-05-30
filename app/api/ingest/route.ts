import { NextRequest } from 'next/server';
import { auth } from '@/app/api/auth/auth';
import { proxyIngestRequest } from '@/lib/server/forensic-proxy';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return proxyIngestRequest(request, {
    getSession: auth,
    fetchImpl: fetch,
    forensicCoreBaseUrl: process.env.FORENSIC_CORE_BASE_URL,
    forensicCoreServiceToken: process.env.FORENSIC_CORE_SERVICE_TOKEN,
  });
}
