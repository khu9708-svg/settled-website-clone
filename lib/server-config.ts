import 'server-only'
import { PUBLIC_CONFIG } from '@/lib/public-config'

function sanitizeEmail(value: string) {
  const normalized = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : PUBLIC_CONFIG.supportEmail
}

const fromName = process.env.EMAIL_FROM_NAME?.trim() || 'SETTLED'
const fromEmail = sanitizeEmail(process.env.EMAIL_FROM_ADDRESS?.trim() || PUBLIC_CONFIG.supportEmail)

export const SERVER_CONFIG = {
  emailFrom: `${fromName} <${fromEmail}>`,
  emailReplyTo: PUBLIC_CONFIG.supportEmail,
}
