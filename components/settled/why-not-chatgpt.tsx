import { Check, X } from "lucide-react"
import { Stagger } from "@/components/settled/stagger"
import { Reveal } from "@/components/settled/reveal"

const rows = [
  { chatgpt: "Generic AI responses", settled: "Structured dispute workflows" },
  { chatgpt: "No certified mail", settled: "USPS Certified Mail built in" },
  { chatgpt: "No dispute strategy", settled: "Statute-aware response systems" },
  { chatgpt: "No workflow automation", settled: "Guided resolution process" },
  { chatgpt: "No consumer analysis", settled: "Credit, debt, and student loan intelligence" },
  { chatgpt: "No evidence organization", settled: "Structured documentation engine" },
  { chatgpt: "No escalation tracking", settled: "Resolution-focused workflows" },
]

export function WhyNotChatGPT() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-30">
      <div className="rounded-2xl border border-border bg-card/40 p-6 lg:p-10">
        <Stagger className="text-center">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7BA4FF]">THE DIFFERENCE</span>
          <h2 className="mt-3 text-balance text-3xl font-bold text-white lg:text-[48px] lg:leading-[1.05]">
            Why SETTLED Instead of ChatGPT?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/55">
            A chatbot gives you words. SETTLED gives you a structured resolution system built for documentation,
            delivery, and follow-through.
          </p>
        </Stagger>

        <Stagger className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-xl border border-border" step={0.05} y={12}>
          {/* Header row */}
          <div className="grid grid-cols-2">
            <div className="border-b border-r border-border bg-background/60 px-4 py-3 text-center text-sm font-bold text-muted-foreground">
              ChatGPT
            </div>
            <div className="border-b border-border bg-settled-blue/10 px-4 py-3 text-center text-sm font-bold text-settled-blue">
              SETTLED
            </div>
          </div>

          {rows.map((row, i) => (
            <div key={row.settled} className="grid grid-cols-2">
              <div
                className={`flex items-center gap-2 border-r border-border px-4 py-3 ${
                  i < rows.length - 1 ? "border-b" : ""
                }`}
              >
                <X className="size-4 shrink-0 text-destructive" />
                <span className="text-xs text-muted-foreground">{row.chatgpt}</span>
              </div>
              <div
                className={`flex items-center gap-2 bg-settled-blue/5 px-4 py-3 ${
                  i < rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Check className="size-4 shrink-0 text-settled-blue" />
                <span className="text-xs font-medium text-foreground">{row.settled}</span>
              </div>
            </div>
          ))}
        </Stagger>

        <Reveal>
          <p className="mx-auto mt-10 max-w-2xl text-balance text-center text-[22px] font-bold leading-snug text-white">
            ChatGPT gives you words. SETTLED gives you a case.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
