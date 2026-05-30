"use client"

import Image from "next/image"
import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap"
import { Stagger } from "@/components/settled/stagger"

const steps = [
  {
    number: "01",
    title: "Upload the document",
    body: "Start with the report or loan statement in front of you. Upload a PDF or paste the details that look wrong.",
    image: "/images/student-loan.png",
  },
  {
    number: "02",
    title: "SETTLED reads for reporting problems",
    body: "The engine looks for inaccurate, incomplete, outdated, unverifiable, or protected-period reporting issues.",
    image: "/images/credit-error.png",
  },
  {
    number: "03",
    title: "You see the issue before any letter is used",
    body: "Potential violations, statutes, confidence, and plain-English context appear on the same screen for review.",
    image: "/images/story-man.png",
  },
  {
    number: "04",
    title: "A document-specific letter is created",
    body: "The letter is written around the facts in the document, not a generic template. If the scan does not find a reportable issue, we say that plainly.",
    image: "/images/usps-mail.png",
  },
]

const nextSteps = [
  "Download the letter and review it before sending.",
  "Use certified mail when a paper trail matters.",
  "Track the response window and escalate only when the facts support it.",
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const afterRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        if (stepsRef.current) gsap.set(stepsRef.current.children, { autoAlpha: 1, y: 0 })
        if (afterRef.current) gsap.set(afterRef.current, { autoAlpha: 1, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (stepsRef.current?.children.length) {
          gsap.from(stepsRef.current.children, {
            autoAlpha: 0,
            y: 24,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 85%",
              once: true,
            },
          })
        }

        if (afterRef.current) {
          gsap.from(afterRef.current, {
            autoAlpha: 0,
            y: 20,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: afterRef.current,
              start: "top 90%",
              once: true,
            },
          })
        }
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section id="how-it-works" ref={sectionRef} className="mx-auto max-w-[1200px] px-4 py-24 scroll-mt-20">
      <Stagger className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">The Process</p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.02] text-white md:text-5xl">
            A clean path from document to dispute.
          </h2>
        </div>
        <p className="max-w-2xl text-lg font-bold leading-relaxed text-white/75">
          SETTLED is built for people who need to understand what is wrong, what law may apply, and what to do next without paying hundreds before they even know if they have a real issue.
        </p>
      </Stagger>

      <div ref={stepsRef} className="mt-12 grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <article key={step.number} className="overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
            <div className="relative h-52 border-b border-white/10">
              <Image src={step.image} alt="" fill className="object-cover opacity-70" sizes="(min-width: 768px) 50vw, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
              <span className="absolute bottom-4 left-5 text-5xl font-semibold leading-none text-white/20">{step.number}</span>
            </div>
            <div className="p-5 md:p-6">
              <h3 className="text-xl font-semibold leading-tight text-white">{step.title}</h3>
              <p className="mt-3 text-base font-bold leading-relaxed text-white/68">{step.body}</p>
            </div>
          </article>
        ))}
      </div>

      <div
        ref={afterRef}
        className="mt-5 grid gap-4 rounded-xl border border-[#2563EB]/25 bg-[#07101f] p-5 md:grid-cols-[0.9fr_1.1fr] md:p-7"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">After the scan</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">The software gives you direction, not false promises.</h3>
        </div>
        <ul className="space-y-3">
          {nextSteps.map((item) => (
            <li key={item} className="border-l-2 border-[#2563EB] pl-4 text-base font-bold leading-relaxed text-white/75">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
