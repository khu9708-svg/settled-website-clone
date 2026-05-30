import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Stagger } from "@/components/settled/stagger"

const records = [
  {
    label: "Document reviewed",
    detail: "Loan statement, credit report, bureau response, or business tradeline.",
  },
  {
    label: "Issue saved",
    detail: "The violation, statute, confidence score, and letter stay attached to the case.",
  },
  {
    label: "Next step clear",
    detail: "Download, send, wait for response, or prepare an escalation when the record supports it.",
  },
]

export function DashboardPreview() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <Stagger>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Your Workspace</p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.02] text-white md:text-5xl">
            Not a score toy. A dispute file you can actually use.
          </h2>
          <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-white/76">
            The dashboard is built around evidence: documents, generated letters, response windows, and the next action. No fake progress charts. No pretending an outcome is guaranteed.
          </p>

          <div className="mt-7 space-y-3">
            {records.map((record) => (
              <div key={record.label} className="settled-paper rounded-lg p-4">
                <h3 className="text-base font-semibold text-white">{record.label}</h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/68">{record.detail}</p>
              </div>
            ))}
          </div>

          <Button asChild className="mt-7 h-auto bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2563EB]/90">
            <a href="/pricing">Choose a plan</a>
          </Button>
        </Stagger>

        <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-white/10 bg-[#050505] shadow-[0_28px_100px_rgba(0,0,0,0.42)]">
          <Image
            src="/images/settled-case-desk.png"
            alt="Person reviewing financial documents at a desk"
            fill
            className="object-cover opacity-74"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/58 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="max-w-lg text-2xl font-semibold leading-tight text-white">
              Built for people reviewing real debt documents, not people browsing generic templates.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
