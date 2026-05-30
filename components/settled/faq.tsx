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
    q: "Is this legal?",
    a: "Yes. Under the Fair Credit Reporting Act (FCRA), you have the right to dispute inaccurate, outdated, or unverifiable information on your credit report. SETTLED helps you identify potential errors and generate dispute correspondence. We are not a law firm and do not provide legal advice.",
  },
  {
    q: "How is this different from Credit Karma or ChatGPT?",
    a: "Monitoring tools show you a score. Generic AI writes broad text. SETTLED reads the document details you provide, cites statutes that may apply, builds structured disputes, and gives you delivery options including download and certified mail tracking.",
  },
  {
    q: "Will disputing hurt my credit score?",
    a: "Submitting a dispute is not the same as missing a payment or opening new debt. Credit score results vary, and SETTLED does not guarantee score changes, deletions, approvals, or outcomes. The goal is to dispute information you believe is inaccurate, incomplete, unverifiable, unauthorized, or misreported.",
  },
  {
    q: "What happens after I run a scan?",
    a: "Your document is analyzed for possible reporting errors and violations. Issues are listed with relevant statutes, a custom dispute is generated, and you choose the next step: review, download, or use a certified mail workflow when you need tracking.",
  },
  {
    q: "Do you store my documents?",
    a: "SETTLED routes documents through the upload flow for analysis. Do not email credit reports or identity documents unless support specifically provides a secure process. Review the privacy policy for how data is used and handled.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. The one-time analysis has no recurring charge, and monthly plans can be canceled at any time with no penalties or hidden fees.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-[800px] px-4 py-30 scroll-mt-20">
      <Stagger className="text-center">
        <span className="block text-[11px] font-bold tracking-wider text-[#7BA4FF]">QUESTIONS &amp; ANSWERS</span>
        <h2 className="mt-2 text-balance text-2xl font-bold lg:text-4xl">Everything you need to know.</h2>
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
