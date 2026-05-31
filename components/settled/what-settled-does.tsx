import { FileUp, SearchCheck, FileText, MailCheck } from "lucide-react"
import { Stagger } from "@/components/settled/stagger"

const steps = [
  {
    icon: FileUp,
    title: "Upload your document",
    body: "Paste or upload your student loan record, credit report, tax lien notice, ChexSystems file, or MOHELA / Navient statement. We read the actual document — not a summary.",
    highlight: false,
  },
  {
    icon: SearchCheck,
    title: "We find the errors",
    body: "Our forensic engine checks for wrong balances, duplicate entries, reporting violations, and FCRA statute breaches. Every finding is cited by law — not guessed.",
    highlight: false,
  },
  {
    icon: FileText,
    title: "You get the dispute letter",
    body: "Every letter is built from your facts and your document. Not a template. Not a chatbot response. A document-specific dispute backed by federal statute.",
    highlight: false,
  },
  {
    icon: MailCheck,
    title: "We send it — certified mail included",
    body: "No other dispute service does this. Settled sends your letter via certified USPS mail with tracking. You get proof of delivery and know exactly when the 30-day response window starts.",
    highlight: true,
  },
]

export function WhatSettledDoes() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-18">
      <div className="rounded-2xl border border-[#2563EB]/30 bg-[#071126] p-6 lg:p-8">
        <Stagger className="grid gap-8 lg:grid-cols-[0.9fr_1.5fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">
              What SETTLED Is
            </p>
            <h2 className="mt-4 text-pretty text-3xl font-semibold leading-[1.05] text-white lg:text-[44px]">
              The only student loan dispute service that reads your documents, finds the errors, and mails the letter for you.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              If MOHELA reported the wrong balance, Navient duplicated a loan, or a tax lien stayed on your report after it was released — you were probably told to &ldquo;call the servicer.&rdquo; That does not work. Settled builds a real dispute from your actual document. If we find something, we fight it. If we don&rsquo;t, you get a clean status — no weak letter, no upsell.
            </p>
            {/* Certified mail differentiator callout */}
            <div className="mt-5 rounded-xl border border-[#2563FF]/35 bg-[#2563FF]/[0.07] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7BA4FF]">
                Only on Settled
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Built-in certified mail delivery. We send your dispute letter via USPS with tracking — so you have legal proof it arrived. No other credit dispute platform does this.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`rounded-xl border p-4 ${
                  step.highlight
                    ? "border-[#2563FF]/45 bg-[#2563FF]/[0.07] shadow-[0_0_24px_rgba(37,99,255,0.10)]"
                    : "border-white/10 bg-black/35"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${step.highlight ? "bg-[#2563FF]/30 text-[#7BA4FF]" : "bg-[#2563EB]/20 text-[#7BA4FF]"}`}>
                    <step.icon className="size-4" />
                  </div>
                  <h3 className={`font-bold ${step.highlight ? "text-white" : "text-white"}`}>{step.title}</h3>
                  {step.highlight && (
                    <span className="ml-auto rounded-full bg-[#2563FF]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#7BA4FF]">
                      Unique
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{step.body}</p>
              </div>
            ))}
          </div>
        </Stagger>
      </div>
    </section>
  )
}
