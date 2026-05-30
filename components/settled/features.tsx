import { Stagger } from "@/components/settled/stagger"

const features = [
  {
    title: "Start with one document",
    body: "Run a single scan before committing to a monthly plan. SETTLED should prove useful before it asks for more money.",
  },
  {
    title: "Document-specific letters",
    body: "The letter is built from the facts you provide, the issue detected, and the statutes that may apply to that issue.",
  },
  {
    title: "Honest scan results",
    body: "If the document does not show a reportable dispute issue, the experience should say that clearly instead of forcing a weak letter.",
  },
  {
    title: "Review before sending",
    body: "Users see the findings and letter before using them. SETTLED does not replace legal advice or guarantee deletions.",
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
