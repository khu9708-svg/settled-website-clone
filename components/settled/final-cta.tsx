import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import { Stagger } from "@/components/settled/stagger"

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-30">
      <div className="overflow-hidden rounded-2xl border border-[#2563EB]/40 bg-[#0a1228] p-8 text-center lg:p-14">
        <Stagger className="mx-auto flex max-w-2xl flex-col items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/40 bg-[#2563EB]/10 px-3 py-1 text-[11px] font-semibold text-[#7BA4FF]">
            <ShieldCheck className="size-3.5" />
            Get started in 60 seconds.
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold leading-tight lg:text-5xl">
            Start with the student loan record that keeps bothering you.
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground lg:text-base">
            Run a focused scan, review the possible violations, and generate a letter that is based on your document,
            not a generic template.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="h-auto whitespace-nowrap px-6 py-3 font-semibold bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
            >
              <a href="/student-loans">Scan My Student Loans</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto whitespace-nowrap px-6 py-3 font-semibold border-border bg-transparent text-foreground hover:bg-secondary"
            >
              <a href="/pricing">See Affordable Pricing</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No guaranteed outcomes. No factual-debt games. Just document review, dispute letters, and tracked next steps.
          </p>
        </Stagger>
      </div>
    </section>
  )
}
