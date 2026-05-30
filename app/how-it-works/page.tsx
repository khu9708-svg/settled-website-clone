import { Header } from "@/components/settled/header"
import { WhatSettledDoes } from "@/components/settled/what-settled-does"
import { StudentLoan } from "@/components/settled/student-loan"
import { CertifiedMail } from "@/components/settled/certified-mail"
import { HowItWorks } from "@/components/settled/how-it-works"
import { DashboardPreview } from "@/components/settled/dashboard-preview"
import { FAQ } from "@/components/settled/faq"
import { FinalCTA } from "@/components/settled/final-cta"
import { Footer } from "@/components/settled/footer"

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto max-w-[960px] px-4 pb-8 pt-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">How SETTLED Works</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-pretty text-4xl font-semibold leading-[1.04] text-white md:text-6xl">
          See the problem. Understand the law. Send a cleaner dispute.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          SETTLED starts with student loan reporting errors, then supports credit, collections, identity theft, and business credit disputes with the same document-first workflow.
        </p>
      </section>
      <WhatSettledDoes />
      <HowItWorks />
      <StudentLoan />
      <CertifiedMail />
      <DashboardPreview />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
