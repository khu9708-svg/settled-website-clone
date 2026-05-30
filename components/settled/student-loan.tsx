import { Button } from "@/components/ui/button"
import { Stagger } from "@/components/settled/stagger"

const stats = [
  {
    value: "Servicers",
    label: "can report late payments, balances, transfer details, or forbearance status incorrectly",
  },
  {
    value: "Millions",
    label: "of borrowers have student loan tradelines that can affect housing, lending, and employment screening",
  },
  {
    value: "30 Days",
    label: "is the standard FCRA investigation window after a bureau receives a dispute",
  },
]

export function StudentLoan() {
  return (
    <section id="student-loans" className="w-full bg-black px-4 py-30 scroll-mt-20">
      <div className="mx-auto max-w-[1200px]">
        <Stagger>
          {/* Label */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#7BA4FF" }}>
            The First of Its Kind — Student Loan Dispute Engine
          </p>

          {/* Headline */}
          <h2 className="mt-5 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.04] text-white">
            Nobody Told You<br />
            You Could Fight Back.<br />
            We Did.
          </h2>

          {/* Subheadline */}
          <p className="mt-6 max-w-[700px] text-[18px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Did you know you can dispute student loan reporting errors directly on your credit report? When Navient
            transferred a loan, when MOHELA reported a status, when COVID forbearance protected a payment period, or
            when a balance changed, the reporting still has to be accurate. SETTLED is built to help borrowers find
            possible student loan reporting problems and turn the document facts into a clearer dispute letter.
          </p>
        </Stagger>

        {/* Stat cards */}
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="h-full rounded-xl border-l-4 p-6"
              style={{ background: "#0a0a0a", borderColor: "#2563EB" }}
            >
              <p className="text-4xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </Stagger>

        {/* Callout box */}
        <div
          className="mt-8 w-full rounded-xl border p-6"
          style={{ background: "#0a0a0a", borderColor: "#2563EB" }}
        >
          <p className="text-base font-medium leading-relaxed text-white">
            &ldquo;If Navient, MOHELA, AES, EdFinancial, Aidvantage, or FedLoan has ever touched your loan, review the
            dates, balances, payment status, transfer history, and forbearance reporting before assuming the tradeline
            is accurate.&rdquo;
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            asChild
            className="h-auto px-6 py-3 text-base font-bold text-white"
            style={{ background: "#2563EB" }}
          >
            <a href="/student-loans">Scan My Student Loan Report</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
