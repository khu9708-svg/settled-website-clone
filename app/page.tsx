import { Header } from "@/components/settled/header"
import { Hero } from "@/components/settled/hero"
import { Pricing } from "@/components/settled/pricing"
import { IntegritySection } from "@/components/settled/integrity-section"
import { Footer } from "@/components/settled/footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <Hero />
      <Pricing />
      <IntegritySection />
      <Footer />
    </main>
  )
}
