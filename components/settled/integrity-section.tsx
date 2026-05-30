const identityRows = [
  {
    key: "ORIGIN",
    value:
      "Built after direct exposure to servicer misreporting, bureau stonewalling, and credit documentation systems designed to exhaust borrowers before they ever see the discrepancy.",
  },
  {
    key: "MISSION",
    value:
      "To give borrowers forensic-grade capability to identify and dispute non-factual reporting errors — student loans, credit tradelines, tax liens, ChexSystems, LexisNexis, and EWS.",
  },
  {
    key: "BOUNDARY",
    value:
      "SETTLED does not dispute factual debts. SETTLED audits for reporting errors. If no issue exists, the unified forensic engine reports Status: Clean.",
  },
  {
    key: "METHOD",
    value:
      "Unified intake, domain classification, statutory library injection, discrepancy extraction, FCRA dispute-letter compilation, and tracked delivery record.",
  },
]

export function IntegritySection() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-14">
      <div className="border border-white/12 bg-[#030303]">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#7BA4FF]">[IDENTITY LOG: SETTLED]</p>
        </div>
        <div className="divide-y divide-white/10">
          {identityRows.map((row) => (
            <div key={row.key} className="grid gap-3 px-5 py-5 md:grid-cols-[180px_1fr]">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">{row.key}</p>
              <p className="max-w-3xl text-base font-semibold leading-relaxed text-white/62">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
