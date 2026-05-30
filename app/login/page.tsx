'use client'

import { useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/settled/header'
import { Footer } from '@/components/settled/footer'
import { Button } from '@/components/ui/button'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleConfigured, setGoogleConfigured] = useState(true)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const dashboardPath = callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'

  useEffect(() => {
    fetch('/api/auth/config-status')
      .then((response) => response.json())
      .then((data) => setGoogleConfigured(Boolean(data.googleConfigured)))
      .catch(() => setGoogleConfigured(false))
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email.')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
        setLoading(false)
      } else if (result?.ok) {
        router.push(dashboardPath)
      } else {
        setError('Sign-in could not be completed. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Sign-in failed due to a network or provider error. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!googleConfigured) {
      setError('Google OAuth is unavailable. Enter your email below to continue to your dashboard.')
      emailInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      await signIn('google', { callbackUrl: dashboardPath, redirect: true })
    } catch {
      setError('Google sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto grid max-w-[1040px] gap-10 px-4 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#7BA4FF]">Existing User Sign In</p>
          <h1 className="mt-7 max-w-md text-pretty text-[clamp(2.15rem,4.3vw,3.8rem)] font-medium leading-[0.98] text-white">
            Return to your saved dispute file.
          </h1>
          <p className="mt-6 max-w-md text-base font-medium leading-[1.75] text-white/68">
            Existing SETTLED users can sign in to reopen saved scans, letters, tracking numbers, response dates,
            and case notes in the dashboard.
          </p>
          <div className="mx-auto mt-8 grid max-w-[420px] gap-3 lg:mx-0">
            {[
              'Saved dispute letters',
              'Tracking and response dates',
              'Dashboard after checkout or scan save',
            ].map((item) => (
              <div key={item} className="settled-paper rounded-xl px-5 py-4 text-center text-sm font-medium leading-relaxed text-white/72 lg:text-left">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="settled-panel mx-auto w-full max-w-[520px] rounded-2xl p-6 md:p-8">
          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7BA4FF]">Account Access</p>
            <h2 className="mt-3 text-3xl font-medium text-white">Sign in to continue</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">
              Returning users sign in here to access their saved file, letters, tracking, and case notes.
            </p>
          </div>

          {status === 'authenticated' ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#2563EB]/35 bg-[#2563EB]/10 p-4">
                <p className="text-sm font-semibold text-white">You are signed in.</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-white/55">
                  Current account: {session?.user?.email || 'SETTLED user'}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => router.push(dashboardPath)}
                className="h-12 w-full max-w-none rounded-lg bg-[#2563EB] px-6 text-sm font-semibold text-white hover:bg-[#2563EB]/90"
              >
                Open My Dashboard
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="h-12 w-full max-w-none rounded-lg border-white/15 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign Out
              </Button>
            </div>
          ) : (
          <>
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="h-12 w-full max-w-none rounded-lg bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
            {!googleConfigured && (
              <p className="text-sm text-amber-300">
                Google OAuth is not configured locally. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable this button.
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#050505] px-2 text-white/50">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                className="settled-input h-12 w-full max-w-none rounded-lg px-4 text-sm focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full max-w-none rounded-lg bg-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(37,99,235,0.34)] hover:bg-[#2563EB]/90"
              >
                {loading ? 'Signing in...' : 'Existing User Sign In'}
              </Button>
            </form>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm font-medium text-white/58">
            <p>New to SETTLED? <a href="/get-started" className="text-[#7BA4FF] hover:text-white">Create an account</a></p>
          </div>
          </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  )
}
