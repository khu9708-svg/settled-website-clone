'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/settled/header'
import { Footer } from '@/components/settled/footer'
import { Button } from '@/components/ui/button'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleConfigured, setGoogleConfigured] = useState(true)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const { status } = useSession()
  const router = useRouter()
  const nextPath = '/pricing'

  useEffect(() => {
    fetch('/api/auth/config-status')
      .then((response) => response.json())
      .then((data) => setGoogleConfigured(Boolean(data.googleConfigured)))
      .catch(() => setGoogleConfigured(false))
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(nextPath)
    }
  }, [router, status])

  const handleEmailSignup = async (e: React.FormEvent) => {
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
        setError('Account setup failed. Try Google or a different email.')
        setLoading(false)
      } else if (result?.ok) {
        router.push(nextPath)
      } else {
        setError('Account setup could not be completed. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Account setup failed due to a network or provider error. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!googleConfigured) {
      setError('Google OAuth is unavailable. Enter your email below to continue to plan selection.')
      emailInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      await signIn('google', { callbackUrl: nextPath, redirect: true })
    } catch {
      setError('Google sign-up failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto grid max-w-[1040px] gap-10 px-4 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#7BA4FF]">New User Setup</p>
          <h1 className="mt-7 max-w-md text-pretty text-[clamp(2.15rem,4.3vw,3.8rem)] font-medium leading-[0.98] text-white">
            Create your SETTLED account.
          </h1>
          <p className="mt-6 max-w-md text-base font-medium leading-[1.75] text-white/68">
            Start here if you are new. Your account is where scans, dispute letters, certified mail details,
            and case notes belong after checkout.
          </p>
          <div className="mx-auto mt-8 grid max-w-[420px] gap-3 lg:mx-0">
            {[
              'Create account access before choosing a plan',
              'Keep student loan, credit, and business files together',
              'Return later through Log In to continue your case',
            ].map((item) => (
              <div key={item} className="settled-paper rounded-xl px-5 py-4 text-center text-sm font-medium leading-relaxed text-white/72 lg:text-left">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="settled-panel mx-auto w-full max-w-[520px] rounded-2xl p-6 md:p-8">
          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7BA4FF]">Account Setup</p>
            <h2 className="mt-3 text-3xl font-medium text-white">Get started with SETTLED</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">
              Create your account, then choose the plan that fits your dispute.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="h-12 w-full max-w-none rounded-lg bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
            >
              {loading ? 'Creating account...' : 'Create Account with Google'}
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

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <input
                ref={emailInputRef}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="settled-input h-12 w-full max-w-none rounded-lg px-4 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full max-w-none rounded-lg bg-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_0_34px_rgba(37,99,235,0.34)] hover:bg-[#2563EB]/90"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm font-medium text-white/58">
            <p>Already have a file? <a href="/login?callbackUrl=/dashboard" className="text-[#7BA4FF] hover:text-white">Log in here</a></p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
