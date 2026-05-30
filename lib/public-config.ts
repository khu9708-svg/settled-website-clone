const DEFAULT_SITE_URL = 'http://localhost:3000'
const DEFAULT_SUPPORT_EMAIL = 'intake@settled.support'

function sanitizeUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

function sanitizeEmail(value: string) {
  const normalized = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : DEFAULT_SUPPORT_EMAIL
}

export const PUBLIC_CONFIG = {
  siteUrl: sanitizeUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL),
  supportEmail: sanitizeEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL),
}

export function supportMailtoHref() {
  return `mailto:${PUBLIC_CONFIG.supportEmail}`
}
