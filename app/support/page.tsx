import { Mail, MessageCircle, ShieldCheck } from "lucide-react"
import { Header } from "@/components/settled/header"
import { Footer } from "@/components/settled/footer"
import { PUBLIC_CONFIG } from "@/lib/public-config"

const contactItems = [
  {
    icon: Mail,
    title: "Support inbox",
    body: `Questions about uploads, billing, generated letters, or next steps can be sent to ${PUBLIC_CONFIG.supportEmail}.`,
  },
  {
    icon: MessageCircle,
    title: "Customer questions",
    body: "Use this route for billing, account, dispute workflow, and certified mail questions.",
  },
  {
    icon: ShieldCheck,
    title: "Sensitive documents",
    body: "Do not ask users to email credit reports. Route sensitive files through secure upload.",
  },
]

const legalSections = [
  {
    id: "terms",
    title: "Terms of Service",
    body:
      "SETTLED provides document analysis, dispute organization, correspondence generation, and workflow tools. SETTLED is not a law firm and does not provide legal advice. Users are responsible for reviewing generated materials before sending them.",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    body:
      "SETTLED handles sensitive financial and identity-related information to provide document analysis, letter generation, payment processing, delivery workflows, support, and platform security.",
  },
  {
    id: "refund",
    title: "Refund Policy",
    body:
      "Refund requests are reviewed through support. Certified mail, third-party delivery, and completed document-analysis services may be non-refundable once processing has begun.",
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    body:
      "SETTLED is not a law firm, does not provide legal advice, and does not guarantee credit score changes, deletions, approvals, settlements, or financial outcomes. Users should review all generated materials for accuracy.",
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section id="contact" className="mx-auto max-w-[980px] px-4 py-24 scroll-mt-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Support &amp; Legal</p>
        <h1 className="mt-5 max-w-3xl text-pretty text-4xl font-semibold leading-[1.04] text-white md:text-6xl">
          A clear place for help, privacy, and legal trust.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Customers need to know there is a real support path and clear boundaries before uploading sensitive documents.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {contactItems.map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-[#080808] p-5">
              <item.icon className="size-6 text-[#7BA4FF]" />
              <h2 className="mt-4 text-lg font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 pb-24">
        <div className="grid gap-4">
          {legalSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-xl border border-white/10 bg-[#080808] p-6"
            >
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
