import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Stagger } from "@/components/settled/stagger"
import { Reveal } from "@/components/settled/reveal"

const faqs = [
  {
    q: "Is disputing with SETTLED legal?",
    a: "Yes. Under the Fair Credit Reporting Act (FCRA), you have the right to dispute inaccurate, incomplete, unverifiable, or misreported information on your credit file. SETTLED's unified forensic engine identifies document-supported reporting failures and compiles dispute correspondence grounded in those facts — not boilerplate. We are not a law firm and do not provide legal advice.",
  },
  {
    q: "How is SETTLED different from Credit Karma or ChatGPT?",
    a: "Credit Karma shows you a score while MOHELA, Navient, and the bureaus keep reporting whatever they want. ChatGPT writes generic paragraphs with no statute mapping, no intake discipline, and no delivery chain. SETTLED's unified forensic engine rips apart your actual document — student loan servicer records, bureau tradelines, tax liens, ChexSystems, LexisNexis, and Early Warning Services files — maps FCRA-relevant statutes to each discrepancy, and builds a letter from your facts. ChatGPT gives you words. SETTLED gives you a case file.",
  },
  {
    q: "Will disputing hurt my credit score?",
    a: "Submitting an FCRA dispute is not the same as missing a payment or opening new debt. Score movement varies by bureau, furnisher response, and what actually changes on the file. SETTLED does not guarantee score changes, deletions, approvals, or outcomes. The engine's job is to surface reporting errors you can challenge with evidence — inaccurate balances, wrong dates, duplicate tradelines, protected-period violations — not to dispute debts you actually owe.",
  },
  {
    q: "What happens after I run a forensic audit?",
    a: "The unified forensic engine classifies your document, injects the relevant statutory library, and extracts every reportable discrepancy it can support from the text you provided. You see violations with cited statutes, confidence scoring, and plain-English context before any letter is generated. If the engine finds nothing reportable, it says so — Status: Clean. No reportable anomalies identified. If it finds issues, you review the dispute letter, download it, or route it through certified mail when you need a paper trail.",
  },
  {
    q: "Does SETTLED handle MOHELA, Navient, and tax lien reporting?",
    a: "Yes. Student loan servicer misreporting — wrong balances after COVID forbearance, missing PSLF payments, duplicate loans across servicers — is a core intake domain. The engine also processes tax lien entries, ChexSystems banking reports, LexisNexis consumer files, and EWS records when those appear in your upload. One intake terminal. Multiple bureau and servicer domains. Document facts drive everything.",
  },
  {
    q: "Do you store my documents?",
    a: "Documents route through the forensic intake flow for analysis and case compilation. Do not email credit reports, servicer statements, or identity documents unless support provides a secure channel. Review the privacy policy for retention, handling, and deletion practices.",
  },
  {
    q: "Can I cancel anytime?",
    a: "The one-time forensic audit has no recurring charge. Monthly plans cancel without penalties, hidden fees, or retention games.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-[800px] px-4 py-30 scroll-mt-20">
      <Stagger className="text-center">
        <span className="block text-[11px] font-bold tracking-wider text-[#7BA4FF]">QUESTIONS &amp; ANSWERS</span>
        <h2 className="mt-2 text-balance text-2xl font-bold lg:text-4xl">
          Straight answers for people tired of bureau runaround.
        </h2>
      </Stagger>
      <Reveal>
      <Accordion type="single" collapsible className="mt-8 w-full">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="mb-3 rounded-xl border border-border bg-card px-5"
          >
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline lg:text-base">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </Reveal>
    </section>
  )
}
