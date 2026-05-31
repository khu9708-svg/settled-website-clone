import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  // Sentry source maps upload is skipped when SENTRY_AUTH_TOKEN is not set
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
