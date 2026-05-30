import { FileCheck2, MailCheck, ShieldCheck, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stagger } from "@/components/settled/stagger"

const proofItems = [
  {
    icon: FileCheck2,
    title: "Student loan expertise",
    body: "Built around servicer mistakes, COVID forbearance reporting, duplicate balances, late-payment errors, and transfer problems.",
  },
  {
    icon: Workflow,
    title: "Document-specific letters",
    body: "Letters are generated from the uploaded facts, dates, servicers, bureaus, and statutes instead of recycled templates.",
  },
  {
    icon: MailCheck,
    title: "Certified mail path",
    body: "The process is built around proof, tracking, and follow-up because documentation matters if the first dispute fails.",
  },
  {
    icon: ShieldCheck,
    title: "Honest boundaries",
    body: "SETTLED does not promise deletions or dispute factual debts. The platform is for real reporting problems.",
  },
]

export function LaunchProof() {
  return (
    <section id="proof" className="mx-auto max-w-[1200px] px-4 py-30 scroll-mt-20">
      <div className="rounded-2xl border border-border bg-card/40 p-6 lg:p-10">
        <Stagger className="mx-auto max-w-3xl text-center">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">
            Why Customers Trust It
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-white lg:text-[46px] lg:leading-[1.05]">
            Better than a generic credit repair template because your documents lead the letter.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/60">
            The strongest dispute starts with the facts: who reported it, when it happened, what looks wrong, what law
            applies, and what proof should be kept for the next step.
          </p>
        </Stagger>

        <Stagger className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4" step={0.08} y={16}>
          {proofItems.map((item) => (
            <div key={item.title} className="flex h-full flex-col rounded-xl border border-border bg-[#070707] p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#7BA4FF]">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
            </div>
          ))}
        </Stagger>

        <div className="mt-8 grid gap-5 rounded-xl border border-[#2563EB]/30 bg-[#071126] p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-white">The next step is simple</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Start with one student loan document. If there is a reporting issue, SETTLED helps turn it into a clearer
              dispute path with organized next steps.
            </p>
          </div>
          <Button asChild className="h-auto bg-[#2563EB] px-6 py-3 font-semibold text-white hover:bg-[#2563EB]/90">
            <a href="/student-loans">Scan My Student Loans</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
