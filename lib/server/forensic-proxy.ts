type SessionShape = {
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
} | null;

type IngestProxyDeps = {
  getSession: () => Promise<SessionShape>;
  fetchImpl: typeof fetch;
  forensicCoreBaseUrl?: string;
  forensicCoreServiceToken?: string;
};

export async function proxyIngestRequest(request: Request, deps: IngestProxyDeps): Promise<Response> {
  const session = await deps.getSession();
  if (!session?.user?.email) {
    return Response.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Authentication is required.',
      },
      { status: 401 }
    );
  }

  const forensicCoreBaseUrl = deps.forensicCoreBaseUrl?.trim();
  const forensicCoreServiceToken = deps.forensicCoreServiceToken?.trim();
  if (!forensicCoreBaseUrl || !forensicCoreServiceToken) {
    return Response.json(
      {
        error: 'FORENSIC_CORE_NOT_CONFIGURED',
        message: 'Forensic core backend is not configured.',
      },
      { status: 503 }
    );
  }

  const contentType = request.headers.get('content-type') || 'application/json';
  const endpoint = `${forensicCoreBaseUrl.replace(/\/$/, '')}/audit/sovereign`;

  try {
    if (contentType.toLowerCase().includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      const rawDocumentText = typeof body?.text === 'string' ? body.text : '';
      const domainHint = typeof body?.domain_hint === 'string' ? body.domain_hint : 'unknown';
      const operatorName = session.user.name || session.user.email?.split('@')[0] || 'Operator';

      const proxyResponse = await deps.fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${forensicCoreServiceToken}`,
        },
        body: JSON.stringify({
          raw_document_text: rawDocumentText,
          operator_name: operatorName,
          domain_hint: domainHint,
        }),
      });
      const payload = await proxyResponse.json().catch(() => ({}));
      return Response.json(payload, { status: proxyResponse.status });
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('document');
    const supplementalText = String(formData.get('text') || '').trim();
    const domainHint = String(formData.get('domain_hint') || 'unknown').trim() || 'unknown';

    const rawDocumentText =
      uploadedFile instanceof File
        ? [await uploadedFile.text().catch(() => ''), supplementalText].filter(Boolean).join('\n')
        : supplementalText;

    const operatorName = session.user.name || session.user.email?.split('@')[0] || 'Operator';
    const proxyResponse = await deps.fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${forensicCoreServiceToken}`,
      },
      body: JSON.stringify({
        raw_document_text: rawDocumentText,
        operator_name: operatorName,
        domain_hint: domainHint,
      }),
    });
    const payload = await proxyResponse.json().catch(() => ({}));
    return Response.json(payload, { status: proxyResponse.status });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'PROXY_ERROR';
    return Response.json(
      {
        error: 'FORENSIC_PROXY_ERROR',
        message: 'Proxy request to forensic core failed.',
        details,
      },
      { status: 502 }
    );
  }
}

