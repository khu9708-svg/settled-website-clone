import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/components/settled/auth-provider'
import { StatusBar } from '@/components/settled/status-bar'
import { PUBLIC_CONFIG } from '@/lib/public-config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_CONFIG.siteUrl),
  title: 'SETTLED | #1 Student Loan Dispute Service — Forensic FCRA Audit & Certified Mail',
  description:
    'Settled is the first student loan dispute service that reads your actual documents, finds FCRA reporting errors, and sends certified dispute letters for you. Fix MOHELA, Navient, Aidvantage, and credit bureau errors — document-specific, not templates.',
  generator: 'v0.app',
  applicationName: 'SETTLED',
  authors: [{ name: 'SETTLED' }],
  keywords: [
    // High-volume credit repair
    'credit repair',
    'how to fix bad credit fast',
    'how to remove collections from credit report',
    'dispute credit report',
    'how to dispute credit report errors',
    'fix credit score',
    'credit repair services',
    // Student loan specific — owned cluster
    'student loan dispute service',
    'student loan credit report error',
    'how to dispute student loan errors',
    'student loan dispute letter',
    'student loan audit',
    'MOHELA late payment dispute',
    'MOHELA credit report error',
    'Navient dispute letter',
    'Navient credit report error',
    'Aidvantage credit report error',
    'COVID forbearance late payment dispute',
    'PSLF payment count error',
    'IDR recertification error',
    // FCRA / legal
    'FCRA dispute',
    'FCRA dispute letter',
    'credit report inaccuracies fix',
    'dispute inaccurate information credit report',
    'credit dispute letter template alternative',
    // Platform-specific
    'forensic credit audit',
    'forensic debt audit',
    'credit dispute software',
    'certified mail dispute letter',
    'certified mail credit disputes',
    // Other domains
    'Tax lien dispute',
    'ChexSystems dispute',
    'LexisNexis dispute',
    'Early Warning Services dispute',
    'business credit disputes',
    'collection dispute letter',
    'charge-off dispute',
    'Equifax dispute',
    'Experian dispute',
  ],
  openGraph: {
    title: 'SETTLED | Student Loan Dispute Service — FCRA Forensic Audit & Certified Mail',
    description:
      'The first student loan dispute service that reads your documents, audits for FCRA violations, and sends certified dispute letters. Not templates — your facts, your statutes, your letter.',
    type: 'website',
    siteName: 'SETTLED',
    images: [
      {
        url: '/images/settled-human-hero.png',
        width: 1200,
        height: 800,
        alt: 'SETTLED dispute workflow preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SETTLED | Student Loan Dispute Service — FCRA Audit & Certified Mail',
    description:
      'Upload your MOHELA or Navient statement. We find the errors. We build the FCRA dispute letter. We send it certified mail. No templates.',
    images: ['/images/settled-human-hero.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" id="top" className="bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <StatusBar />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
