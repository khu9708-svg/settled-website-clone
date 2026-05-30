import { Header } from "@/components/settled/header"
import { Hero } from "@/components/settled/hero"
import { WhatSettledDoes } from "@/components/settled/what-settled-does"
import { HowItWorks } from "@/components/settled/how-it-works"
import { VideoShowcase } from "@/components/settled/video-showcase"
import { Pricing } from "@/components/settled/pricing"
import { Security } from "@/components/settled/security"
import { FAQ } from "@/components/settled/faq"
import { FinalCTA } from "@/components/settled/final-cta"
import { IntegritySection } from "@/components/settled/integrity-section"
import { Footer } from "@/components/settled/footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <Hero />
      <WhatSettledDoes />
      <HowItWorks />
      <VideoShowcase />
      <Pricing />
      <Security />
      <FAQ />
      <FinalCTA />
      <IntegritySection />
      <Footer />
    </main>
  )
}
