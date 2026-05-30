import { FileUp, SearchCheck, FileText, MailCheck } from "lucide-react"
import { Stagger } from "@/components/settled/stagger"

const steps = [
  {
    icon: FileUp,
    title: "Upload or paste",
    body: "Start with a student loan record, credit report, servicer notice, collection letter, or bureau response.",
  },
  {
    icon: SearchCheck,
    title: "Scan for errors",
    body: "SETTLED looks for possible inaccurate, incomplete, unauthorized, duplicate, or misreported information.",
  },
  {
    icon: FileText,
    title: "Generate a letter",
    body: "Every letter is built from the user's document facts, not a generic fill-in-the-blank template.",
  },
  {
    icon: MailCheck,
    title: "Track the next step",
    body: "Download the letter, send it, document delivery, and know when a bureau or furnisher response matters.",
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
              Student loan dispute software first. Credit, collections, and business disputes when you need them.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              SETTLED was built for people who cannot afford hundreds of dollars just to understand what is wrong.
              If the document shows a real reporting issue, we help organize the dispute. If we do not find one, we say so.
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
