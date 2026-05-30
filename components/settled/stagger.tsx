"use client"

import { useRef, type ReactNode } from "react"
import { gsap, useGSAP } from "@/lib/gsap"

/**
 * Stagger — scroll-triggered cascade for direct children.
 * Cinematic fade/slide; respects prefers-reduced-motion.
 */
export function Stagger({
  children,
  className = "",
  y = 22,
  step = 0.1,
  duration = 0.75,
}: {
  children: ReactNode
  className?: string
  y?: number
  step?: number
  duration?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const container = containerRef.current
      if (!container) return

      const targets = Array.from(container.children)
      if (!targets.length) return

      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(targets, { autoAlpha: 1, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(targets, {
          autoAlpha: 0,
          y,
          duration,
          stagger: step,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 88%",
            once: true,
          },
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
