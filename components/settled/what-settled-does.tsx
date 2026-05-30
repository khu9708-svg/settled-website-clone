import { FileUp, SearchCheck, FileText, MailCheck } from "lucide-react"
import { Stagger } from "@/components/settled/stagger"

const steps = [
  {
    icon: FileUp,
    title: "Upload or paste",
    body: "Student loan servicer records, credit bureau files, tax lien notices, ChexSystems reports, LexisNexis entries, or EWS banking flags — whatever document proves the reporting error.",
  },
  {
    icon: SearchCheck,
    title: "Forensic credit audit",
    body: "The unified forensic engine scans for inaccurate, incomplete, unauthorized, duplicate, or misreported information across every domain in your upload.",
  },
  {
    icon: FileText,
    title: "FCRA dispute letter",
    body: "Every letter is compiled from your document facts and cited statutes — not a generic template pulled from a chatbot.",
  },
  {
    icon: MailCheck,
    title: "Track the next step",
    body: "Download the letter, send it, document certified-mail delivery, and know exactly when a bureau or furnisher response window opens.",
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
              A unified forensic engine for student loan audits, FCRA disputes, and bureau accountability.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              Built for people who watched MOHELA report the wrong balance, Navient duplicate a loan, or a tax lien
              linger after release — and got told to &ldquo;just call the servicer.&rdquo; If your document shows a
              real reporting failure, the engine organizes the dispute. If it does not, you get a clean status — no
              weak letter, no upsell.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="rounded-xl border border-white/10 bg-black/35 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#7BA4FF]">
                    <step.icon className="size-4" />
                  </div>
                  <h3 className="font-bold text-white">{step.title}</h3>
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
