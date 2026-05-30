import { Stagger } from "@/components/settled/stagger"

const commitments = [
  "Sensitive reports move through the upload flow, not casual email threads.",
  "Generated letters should be reviewed before use.",
  "Certified mail is offered for tracking and documentation when a paper trail matters.",
  "SETTLED does not sell credit outcomes, legal representation, or guaranteed deletions.",
]

export function Security() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-24">
      <div className="rounded-xl border border-white/10 bg-[#050505] p-6 md:p-8">
        <Stagger className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Trust Position</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">Plain about what SETTLED is, and what it is not.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {commitments.map((item) => (
              <div key={item} className="border-l-2 border-[#2563EB] bg-white/[0.025] p-4">
                <p className="text-base font-bold leading-relaxed text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </Stagger>
      </div>
    </section>
  )
}
