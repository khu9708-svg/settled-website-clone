"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stagger } from "@/components/settled/stagger"

const checks = [
  "Certified Mail creates a trackable delivery record",
  "Delivery confirmation helps document when the dispute was received",
  "The FCRA investigation window is easier to track when delivery is documented",
  "A paper trail matters if the dispute needs follow-up or escalation",
]

export function CertifiedMail() {
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showNextStep, setShowNextStep] = useState(false)

  return (
    <section id="certified-mail" className="w-full bg-black px-4 py-30 scroll-mt-20">
      <div className="mx-auto max-w-[1200px]">
        <Stagger>
          {/* Label */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#7BA4FF" }}>
            Why Certified Mail Changes Everything
          </p>

          {/* Headline */}
          <h2 className="mt-5 max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.06] text-white">
            Certified mail gives your dispute a paper trail.
          </h2>

          {/* Subheadline */}
          <p className="mt-6 max-w-[700px] text-[17px] font-semibold leading-relaxed text-white/80">
            Sending a dispute with tracking helps you prove when it was delivered and makes follow-up cleaner. SETTLED
            is built around documentation: generate the letter, verify the facts, send it carefully, and track what
            happens next.
          </p>
        </Stagger>

        {/* Checklist */}
        <Stagger className="mt-8 space-y-4">
          {checks.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 shrink-0" style={{ color: "#2563EB" }} />
              <span className="text-base text-white">{item}</span>
            </div>
          ))}
        </Stagger>

        {/* CTA */}
        <div className="mt-10">
          {showNextStep ? (
            <div className="max-w-xl rounded-xl border border-[#2563EB]/30 bg-[#071126] p-5">
              <h3 className="text-lg font-semibold text-white">Certified mail is handled after the letter is generated.</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/70">
                Run a scan first, review the dispute letter, then use the delivery workflow attached to that letter.
                That keeps the address, document, and tracking record tied to the right dispute.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="bg-[#2563EB] text-white hover:bg-[#2563EB]/90">
                  <a href="/student-loans">Scan Student Loans</a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNextStep(false)
                    setShowAddressForm(false)
                  }}
                >
                  Edit Address
                </Button>
              </div>
            </div>
          ) : !showAddressForm ? (
            <Button
              type="button"
              variant="outline"
              className="h-auto border px-6 py-3 text-sm font-bold text-white hover:text-white"
              style={{ borderColor: "#2563EB", background: "transparent", color: "white" }}
              onClick={() => setShowAddressForm(true)}
            >
              Send My Dispute via Certified Mail
            </Button>
          ) : (
            <form
              className="max-w-xl space-y-3 rounded-xl border border-[#2563EB]/30 bg-white/[0.03] p-5"
              onSubmit={(event) => {
                event.preventDefault()
                setShowNextStep(true)
              }}
            >
              <h3 className="text-sm font-bold text-white">Certified Mail Address</h3>
              <input
                type="text"
                placeholder="Full name"
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                type="text"
                placeholder="Street address"
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_90px_110px]">
                <input
                  type="text"
                  placeholder="City"
                  className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
                <input
                  type="text"
                  placeholder="State"
                  maxLength={2}
                  className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  maxLength={10}
                  className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" className="bg-settled-blue text-white hover:bg-settled-blue/90">
                  Continue
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
