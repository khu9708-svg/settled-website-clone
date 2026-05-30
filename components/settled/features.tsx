import { Stagger } from "@/components/settled/stagger"

const features = [
  {
    title: "Prove value before you pay",
    body: "Run one forensic audit before committing to a monthly plan. The unified forensic engine should earn your trust with findings, not promises.",
  },
  {
    title: "Document-specific FCRA letters",
    body: "Every dispute letter is compiled from your upload facts, the discrepancy detected, and the statutes the engine mapped to that issue.",
  },
  {
    title: "Honest audit output",
    body: "If the document shows no reportable issue, the engine reports Status: Clean — no weak letter forced through to justify a charge.",
  },
  {
    title: "Review before you send",
    body: "See every finding and the full letter before delivery. SETTLED does not replace legal counsel or guarantee deletions.",
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20">
      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" step={0.07} y={16}>
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border border-white/10 bg-[#080808] p-5">
            <h3 className="text-lg font-semibold leading-tight text-white">{feature.title}</h3>
            <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">{feature.body}</p>
          </article>
        ))}
      </Stagger>
    </section>
  )
}
