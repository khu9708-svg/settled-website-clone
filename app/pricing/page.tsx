import { Header } from "@/components/settled/header"
import { Pricing } from "@/components/settled/pricing"
import { IntegritySection } from "@/components/settled/integrity-section"
import { Footer } from "@/components/settled/footer"
import { PUBLIC_CONFIG, supportMailtoHref } from "@/lib/public-config"

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto max-w-[1200px] px-4 pb-2 pt-20">
        <div className="border-b border-white/10 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#7BA4FF]">Pricing Terminal</p>
        <h1 className="mt-5 max-w-4xl text-pretty text-4xl font-semibold uppercase leading-[0.95] text-white md:text-6xl">
          Select the audit path. Keep the work documented.
        </h1>
        <p className="mt-6 max-w-3xl text-lg font-semibold leading-relaxed text-white/62">
          One document can start the file. Monthly support is for users who need follow-up, delivery tracking, response review,
          and escalation organization.
        </p>
        <p className="mt-5 text-sm font-bold text-white/80">
          Questions before checkout? <a className="text-[#7BA4FF] hover:text-white" href={supportMailtoHref()}>{PUBLIC_CONFIG.supportEmail}</a>
        </p>
        </div>
      </section>
      <Pricing />
      <IntegritySection />
      <Footer />
    </main>
  )
}
