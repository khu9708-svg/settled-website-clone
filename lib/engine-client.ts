const MAX_PDF_BYTES = 20 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx']

export function validateEngineUpload(file: File) {
  const lowerName = file.name.toLowerCase()
  const isSupportedMime =
    file.type === 'application/pdf' ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const hasSupportedExtension = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  const isSupportedFile = isSupportedMime || hasSupportedExtension

  if (!isSupportedFile) {
    return 'Please upload a PDF or Word document (.pdf, .doc, .docx).'
  }

  if (file.size > MAX_PDF_BYTES) {
    return 'This file is too large for direct upload. Paste the full report text into the box below instead.'
  }

  return ''
}

export async function postEngineScan(endpoint: string, formData: FormData) {
  const file = formData.get('document')
  const hasFile = file instanceof File && file.size > 0
  const text = String(formData.get('text') || '').trim()
  const hasText = text.length > 0

  if (!hasFile && !hasText) {
    throw new Error('Provide a document upload or paste account text to continue.')
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
