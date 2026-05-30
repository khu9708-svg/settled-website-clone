const MAX_PDF_BYTES = 20 * 1024 * 1024

export function validateEngineUpload(file: File) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    return 'Please upload a PDF file.'
  }

  if (file.size > MAX_PDF_BYTES) {
    return 'This PDF is too large for direct upload. Paste the full report text into the box below instead. Pasted text is not limited by the PDF upload guard.'
  }

  return ''
}

export async function postEngineScan(endpoint: string, formData: FormData) {
  const file = formData.get('document')
  const hasFile = file instanceof File && file.size > 0

  if (!hasFile) {
    throw new Error('Upload a PDF to continue. /api/ingest is strict PDF-only.')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  return parseEngineResponse(response)
}

async function parseEngineResponse(response: Response) {
  const raw = await response.text()
  let data: any = null

  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      const requestTooLarge =
        response.status === 413 || raw.toLowerCase().includes('request entity too large')

      throw new Error(
        requestTooLarge
          ? 'That PDF is too large for the instant scanner on this host. Paste the full credit report/account text instead; pasted text uses the long-document engine path.'
          : 'The scanner received an unexpected server response. Please paste the document text and run the scan again.'
      )
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.response ||
        data?.unprocessable_reason ||
        data?.details ||
        data?.error ||
        'Analysis failed. Please paste more account details or try again.'
    )
  }

  return data || {}
}
