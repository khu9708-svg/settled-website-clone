import type { Metadata } from 'next'
import { AuthProvider } from '@/components/settled/auth-provider'
import { StatusBar } from '@/components/settled/status-bar'
import { PUBLIC_CONFIG } from '@/lib/public-config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_CONFIG.siteUrl),
  title: 'SETTLED | Forensic Credit Audit, FCRA Dispute Engine, Student Loan Audit Platform',
  description:
    'SETTLED is a forensic debt audit platform for forensic credit audit, FCRA dispute workflows, student loan audit, tax lien review, ChexSystems, LexisNexis, and Early Warning Services disputes with certified mail tracking.',
  generator: 'v0.app',
  applicationName: 'SETTLED',
  authors: [{ name: 'SETTLED' }],
  keywords: [
    'student loan dispute letter',
    'forensic credit audit',
    'forensic debt audit',
    'credit dispute software',
    'credit report audit',
    'student loan audit',
    'FCRA dispute',
    'fcra dispute letter',
    'Forensic Credit Audit',
    'Tax Liens',
    'ChexSystems',
    'LexisNexis',
    'Early Warning Services',
    'Tax lien dispute',
    'ChexSystems dispute',
    'LexisNexis dispute',
    'Early Warning Services dispute',
    'student loan credit report error',
    'MOHELA late payment dispute',
    'COVID forbearance late payment',
    'Navient dispute letter',
    'Aidvantage credit report error',
    'dispute credit report errors',
    'FCRA dispute letters',
    'credit report dispute letter',
    'collection dispute letter',
    'certified mail disputes',
    'Navient',
    'MOHELA',
    'Equifax',
    'Experian',
    'collections',
    'charge-offs',
    'business credit disputes',
  ],
  openGraph: {
    title: 'SETTLED | Forensic Credit Audit & FCRA Dispute Engine',
    description:
      'Forensic credit audit and student loan dispute platform with deterministic engine logic, document-specific dispute letters, and tracked next steps.',
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
    title: 'SETTLED | Forensic Credit Audit & FCRA Dispute Engine',
    description:
      'Run forensic debt audits for credit reports and student loan records, then generate document-specific FCRA dispute letters.',
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
      </body>
    </html>
  )
}
