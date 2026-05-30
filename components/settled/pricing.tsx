"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    id: "surgical_strike",
    name: "SURGICAL STRIKE",
    price: "$19",
    cadence: "ONE-TIME",
    use: "One document scan, issue summary, and document-specific dispute letter.",
  },
  {
    id: "active_pipeline",
    name: "ACTIVE PIPELINE",
    price: "$49",
    cadence: "MONTHLY",
    use: "Ongoing scans, follow-up letters, response dates, and escalation tracking.",
  },
  {
    id: "business_engine",
    name: "BUSINESS ENGINE",
    price: "$99",
    cadence: "MONTHLY",
    use: "Business credit audit support for D&B, PAYDEX, vendor, and bureau records.",
  },
]

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function startCheckout(plan: string) {
    setLoadingPlan(plan)
    setError("")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout failed")
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-14">
      <div className="border-y border-white/10 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#7BA4FF]">Unified Pricing Terminal</p>
            <h2 className="mt-3 text-3xl font-semibold uppercase leading-[0.95] text-white lg:text-5xl">
              Pick the audit depth. No credit repair contract.
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-relaxed text-white/54">
            If no reportable issue is found, SETTLED says that plainly. No factual debt is disputed simply because it is inconvenient.
          </p>
        </div>

        {error ? (
          <p className="mb-4 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </p>
        ) : null}

        <div className="divide-y divide-white/10 border border-white/12 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {plans.map((plan) => (
            <div key={plan.id} className="flex min-h-[230px] flex-col bg-[#030303] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-bold uppercase tracking-[0.14em] text-white">{plan.name}</h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7BA4FF]">{plan.cadence}</p>
                </div>
                <p className="text-4xl font-semibold text-white">{plan.price}</p>
              </div>
              <p className="mt-6 flex-1 text-sm font-semibold leading-relaxed text-white/58">{plan.use}</p>
              <Button
                className={`mt-5 h-11 rounded-none text-sm font-bold uppercase tracking-[0.08em] ${
                  plan.id === "surgical_strike"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                }`}
                disabled={loadingPlan === plan.id}
                onClick={() => startCheckout(plan.id)}
              >
                {loadingPlan === plan.id ? "Opening Checkout" : "Select"}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold leading-relaxed text-white/38">
          SETTLED is not a law firm and does not provide legal advice, guarantee deletions, score changes, approvals, settlements, or outcomes.
        </p>
      </div>
    </section>
  )
}
