import {
  FileText,
  FolderKanban,
  GraduationCap,
  Landmark,
  Lock,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { SettledLogo } from "@/components/settled/logo"

const topBenefits = [
  {
    icon: Shield,
    title: "Secure Document Uploads",
    body: "Bank-level encryption keeps your information protected.",
  },
  {
    icon: Search,
    title: "Personalized Dispute Reviews",
    body: "Every review is tailored to your unique records.",
  },
  {
    icon: Lock,
    title: "Enterprise-Grade Security",
    body: "Your data is encrypted, secure, and never shared.",
  },
  {
    icon: FileText,
    title: "Built Around Your Records",
    body: "No templates. No one-size-fits-all. Just your situation, your case.",
  },
]

const process = [
  { step: "1", title: "Review", body: "We analyze your records and documentation." },
  { step: "2", title: "Identify", body: "Potential issues are identified and organized." },
  { step: "3", title: "Build", body: "Documentation is assembled around your situation." },
  { step: "4", title: "Move Forward", body: "Receive a structured dispute package tailored to you." },
]

const reviewCards = [
  { icon: GraduationCap, title: "Student Loans", body: "Our flagship service. We know student loans inside and out." },
  { icon: Search, title: "Credit Reporting", body: "Errors, inaccuracies, and unverifiable information." },
  { icon: FolderKanban, title: "Collections", body: "Improper collections, incorrect balances, and reporting issues." },
  { icon: Landmark, title: "Consumer Finance", body: "Loans, credit lines, and other consumer accounts." },
  { icon: FileText, title: "Account Documentation", body: "Review of statements, ledgers, and account history." },
  { icon: ShieldCheck, title: "Financial Record Reviews", body: "Comprehensive reviews of financial records." },
]

export function HomepageReplica() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#040814]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 right-0 w-[55%] bg-[radial-gradient(ellipse_at_65%_45%,rgba(37,99,255,0.38),transparent_62%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(0,0,0,0.45),transparent)]" />
        </div>
        <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#2563FF]/55 bg-[#2563FF]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ec0ff]">
              The First Student Loan Dispute Service™
            </div>
            <h1 className="text-[clamp(3rem,7.2vw,6.1rem)] font-bold uppercase leading-[0.96] tracking-[0.12em] text-white">
              S
              <span className="mx-[0.08em] inline-flex flex-col justify-between align-middle" style={{ height: "0.30em", width: "0.46em" }}>
                <span className="h-[0.055em] rounded-sm bg-white/95" />
                <span className="h-[0.055em] rounded-sm bg-[#2563FF] shadow-[0_0_12px_rgba(37,99,255,0.85)]" />
                <span className="h-[0.055em] rounded-sm bg-white/95" />
              </span>
              TTLED
            </h1>
            <p className="mt-3 max-w-xl text-[clamp(1.45rem,2.8vw,2.2rem)] font-bold leading-[1.08] text-white">
              Most services use templates.
              <br />
              <span className="text-[#2563FF]">Settled was built to understand the details.</span>
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/72">
              Student loans are our flagship, but our platform helps consumers review, understand, and challenge a wide range of financial reporting and dispute-related issues.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="/get-started"
                className="rounded-lg bg-[#2563FF] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,255,0.45)] transition hover:bg-[#1f58eb]"
              >
                Start Your Review
              </a>
              <a
                href="/how-it-works"
                className="rounded-lg border border-white/20 bg-black/35 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/35"
              >
                Watch How It Works
              </a>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-white/65">
              <Lock className="size-3.5 text-[#2563FF]" />
              Your data is encrypted, secure, and never shared.
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute inset-x-12 bottom-2 h-16 rounded-full bg-[#2563FF]/35 blur-2xl" />
            <div className="absolute inset-x-6 bottom-0 h-12 rounded-[999px] bg-[linear-gradient(180deg,#1e2335_0%,#0b0f18_100%)] shadow-[0_-1px_0_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.6)]" />
            <div className="relative z-10 flex items-center justify-center gap-4 px-6 pb-16 pt-4">
              <span className="select-none text-[150px] font-extrabold leading-none text-white/90 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]">S</span>
              <div className="space-y-5 pt-4">
                <div className="h-9 w-48 rounded-[999px] bg-[linear-gradient(90deg,#b8d2ff_0%,#5f93ff_100%)] shadow-[0_10px_26px_rgba(37,99,255,0.35)]" />
                <div className="h-9 w-52 rounded-[999px] bg-[linear-gradient(90deg,#6da4ff_0%,#2563FF_100%)] shadow-[0_0_30px_rgba(37,99,255,0.75)]" />
                <div className="h-9 w-48 rounded-[999px] bg-[linear-gradient(90deg,#6da4ff_0%,#2563FF_100%)] shadow-[0_0_30px_rgba(37,99,255,0.75)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 md:grid-cols-2 lg:grid-cols-4">
          {topBenefits.map((item) => (
            <article key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <item.icon className="mt-0.5 size-5 text-[#2563FF]" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563FF]">Our Mission</p>
              <h2 className="mt-2 text-4xl font-extrabold leading-tight text-slate-900">Why Settled Exists</h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-700">
                The financial system depends on complexity. Most consumers are never taught how disputes work.
                They&apos;re never taught how reporting works. They&apos;re never taught what rights they have.
                <br />
                <br />
                Settled was built to bring clarity to a system that most people were never taught to navigate.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(120deg,#0b1021_0%,#1a2238_100%)] p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(37,99,255,0.35),transparent_58%)]" />
              <div className="relative flex h-full min-h-[250px] items-center justify-center rounded-xl border border-white/20 bg-black/25">
                <div className="text-center">
                  <div className="mb-4 inline-flex scale-125"><SettledLogo /></div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/70">SETTLED</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563FF]">Our Process</p>
            <h3 className="mt-2 text-center text-[36px] font-extrabold leading-tight text-slate-900">How Settled Works</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {process.map((item) => (
                <article key={item.step} className="relative rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[#2563FF]/10 text-[#2563FF]">
                    {item.step}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563FF]">What We Help Review</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {reviewCards.map((item) => (
                <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <item.icon className="size-5 text-[#2563FF]" />
                  <h4 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-[#2563FF]/25 bg-[linear-gradient(90deg,#071635_0%,#0c2658_100%)] p-6 text-white">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#2563FF]/20 p-2.5">
                  <Lock className="size-5 text-[#8fb6ff]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ec0ff]">Your Security Matters</p>
                  <h3 className="text-2xl font-bold">Security You Can Trust</h3>
                  <p className="mt-1 text-sm text-white/80">
                    Your records matter. Your privacy matters. Your trust matters.
                  </p>
                </div>
              </div>
              <a
                href="/get-started"
                className="rounded-lg bg-[#2563FF] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(37,99,255,0.45)] transition hover:bg-[#1f58eb]"
              >
                Start Your Review
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center">
                <span className="text-[12px] font-medium tracking-[0.58em] text-slate-900 [font-family:var(--font-plus-jakarta-sans)]">
                  S
                </span>
                <span className="mx-[6px] flex h-[8px] w-[13px] flex-col justify-between" aria-hidden="true">
                  <span className="h-[1px] rounded-full bg-slate-900/90" />
                  <span className="h-[1px] rounded-full bg-[#2563FF]" />
                  <span className="h-[1px] rounded-full bg-slate-900/90" />
                </span>
                <span className="text-[12px] font-medium tracking-[0.58em] text-slate-900 [font-family:var(--font-plus-jakarta-sans)]">
                  TTLED
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">The First Student Loan Dispute Service™</p>
              <p className="text-sm font-semibold text-[#2563FF]">Dispute. Resolve. Move Forward.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <a href="/student-loans" className="hover:text-[#2563FF]">Student Loans</a>
              <a href="/disputes" className="hover:text-[#2563FF]">Credit Reporting</a>
              <a href="/support" className="hover:text-[#2563FF]">Resources</a>
              <a href="/support#privacy" className="hover:text-[#2563FF]">Privacy</a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#050816] py-5">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 text-xs text-white/60">
          <SettledLogo />
          <span>© 2026 Settled. All rights reserved.</span>
        </div>
      </section>
    </>
  )
}
