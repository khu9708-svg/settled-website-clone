import type { Metadata } from 'next'
import { AuthProvider } from '@/components/settled/auth-provider'
import { StatusBar } from '@/components/settled/status-bar'
import { PUBLIC_CONFIG } from '@/lib/public-config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_CONFIG.siteUrl),
  title: 'SETTLED | Student Loan Dispute Letters & Credit Report Error Scanner',
  description:
    'SETTLED scans student loan and credit report documents for possible reporting errors, then generates dispute letters and tracked next steps. Built for MOHELA, Navient, Aidvantage, collections, FCRA disputes, and certified mail workflows.',
  generator: 'v0.app',
  applicationName: 'SETTLED',
  authors: [{ name: 'SETTLED' }],
  keywords: [
    'student loan dispute letter',
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
    title: 'SETTLED | Student Loan Dispute Letters & Credit Report Error Scanner',
    description:
      'Student loan dispute software for possible credit reporting errors, document-specific dispute letters, and tracked next steps.',
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
    title: 'SETTLED | Student Loan Dispute Letters & Credit Report Error Scanner',
    description:
      'Scan student loan and credit report documents for possible reporting errors and generate document-specific dispute letters.',
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
