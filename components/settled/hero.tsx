"use client"

import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap"

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return

      const content = section.querySelectorAll("[data-hero-content]")
      const visual = section.querySelector("[data-hero-visual]")

      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([content, visual], { autoAlpha: 1, x: 0, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.from(content, {
          autoAlpha: 0,
          y: 24,
          duration: 0.85,
          stagger: 0.1,
        }).from(
          visual,
          {
            autoAlpha: 0,
            x: 32,
            duration: 1.1,
          },
          "-=0.55",
        )
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      id="solutions"
      className="relative overflow-hidden border-b border-white/[0.08]"
      style={{ background: "#050816", minHeight: "calc(100vh - 64px)" }}
    >
      {/* Background depth gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Large diffuse right-half blue-purple atmospheric bloom */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-15%",
            width: "80%",
            height: "140%",
            background:
              "radial-gradient(ellipse at 70% 45%, rgba(37,99,255,0.18) 0%, rgba(37,99,255,0.07) 30%, rgba(20,30,80,0.04) 55%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
        {/* Secondary deep-blue haze for right panel depth */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "0",
            width: "55%",
            height: "80%",
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(37,99,255,0.10) 0%, transparent 60%)",
          }}
        />
        {/* Soft left-side dark warmth */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "0",
            width: "45%",
            height: "60%",
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(10,15,40,0.85) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Main grid — upper-half placement matching mockup */}
      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-[1200px] items-start px-5 pt-[18vh] pb-20 sm:px-8 lg:pb-0">
        <div className="grid w-full items-start gap-12 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]">

          {/* ── Left: text hierarchy ── */}
          <div className="flex flex-col">

            {/* 1. SETTLED wordmark */}
            <h1
              data-hero-content
              className="flex items-center font-bold uppercase text-white"
              aria-label="SETTLED"
              style={{
                fontSize: "clamp(3.6rem, 9.5vw, 8rem)",
                letterSpacing: "0.1em",
                lineHeight: 1,
              }}
            >
              <span>S</span>
              {/* Three-bar equal symbol — white / blue / white — mirrors logo.tsx */}
              <span
                className="mx-[0.06em] flex flex-col justify-between"
                aria-hidden="true"
                style={{ width: "0.46em", height: "0.30em" }}
              >
                <span style={{ display: "block", height: "0.055em", background: "rgba(255,255,255,0.92)", borderRadius: "1px" }} />
                <span style={{ display: "block", height: "0.055em", background: "#2563FF", borderRadius: "1px", boxShadow: "0 0 10px rgba(37,99,255,0.85)" }} />
                <span style={{ display: "block", height: "0.055em", background: "rgba(255,255,255,0.92)", borderRadius: "1px" }} />
              </span>
              <span>TTLED</span>
            </h1>

            {/* 2. Tagline */}
            <p
              data-hero-content
              className="mt-3 font-medium text-white/55"
              style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.15rem)", letterSpacing: "0.01em" }}
            >
              The <span style={{ color: "#2563FF" }}>First</span> Student Loan Dispute Service™
            </p>

            {/* 3. DISPUTE. RESOLVE. MOVE FORWARD. */}
            <p
              data-hero-content
              className="mt-5 font-bold uppercase text-white/90"
              style={{ fontSize: "clamp(0.85rem, 1.9vw, 1.2rem)", letterSpacing: "0.3em" }}
            >
              DISPUTE.{" "}
              <span style={{ color: "#2563FF" }}>RESOLVE.</span>{" "}
              MOVE FORWARD.
            </p>

            {/* 4. Differentiator slogan — research-backed placement: between tagline and CTA */}
            <p
              data-hero-content
              className="mt-4 font-medium text-white/70"
              style={{ fontSize: "clamp(0.85rem, 1.4vw, 1rem)", letterSpacing: "0.005em" }}
            >
              Most services hand you a template.{" "}
              <span className="text-white font-semibold">Settled reads your actual documents.</span>
            </p>

            {/* 5. Plain-language body — 6th grade, active voice */}
            <p
              data-hero-content
              className="mt-3 max-w-[460px] leading-relaxed text-white/45"
              style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.95rem)" }}
            >
              Upload your student loan record. We find the errors. You get a dispute letter — built from your facts, not a generic form.
            </p>

            {/* 6. Built-in mail highlight — key differentiator */}
            <div
              data-hero-content
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2563FF]/30 bg-[#2563FF]/[0.08] px-3 py-1.5"
              style={{ width: "fit-content" }}
            >
              <span style={{ color: "#2563FF", fontSize: "0.7rem" }}>✉</span>
              <span className="text-[0.72rem] font-medium text-white/65" style={{ letterSpacing: "0.02em" }}>
                Built-in certified mail tracking — we send it for you
              </span>
            </div>

            {/* 7. CTA buttons */}
            <div data-hero-content className="mt-7 flex flex-wrap items-center gap-5">
              <a
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563FF]"
                style={{
                  background: "#2563FF",
                  boxShadow: "0 0 22px rgba(37,99,255,0.42), 0 1px 4px rgba(0,0,0,0.5)",
                  fontSize: "0.82rem",
                  letterSpacing: "0.01em",
                }}
              >
                Start Your Review →
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 font-medium text-white/60 transition-colors hover:text-white"
                style={{ fontSize: "0.82rem" }}
              >
                How It Works ›
              </a>
            </div>
          </div>

          {/* ── Right: 3D equal-bars visual + product proof panel ── */}
          <div
            data-hero-visual
            className="hidden flex-col items-center gap-6 lg:flex"
            aria-hidden="false"
          >
            <EqualBarsVisual />
            <ForensicProofPanel />
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─── Forensic product proof panel ──────────────────────────────────────── */

function ForensicProofPanel() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "360px",
        background: "rgba(5,8,22,0.92)",
        border: "1px solid rgba(37,99,255,0.28)",
        borderRadius: "10px",
        padding: "14px 16px",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        boxShadow: "0 0 32px rgba(37,99,255,0.10), 0 4px 24px rgba(0,0,0,0.6)",
      }}
    >
      {/* Terminal header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2563FF", boxShadow: "0 0 6px rgba(37,99,255,0.8)" }} />
        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>SETTLED ENGINE · LIVE AUDIT</span>
      </div>
      {/* Audit lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {[
          { label: "INGESTING", value: "MOHELA_STATEMENT_2024.pdf", dim: false },
          { label: "CROSS-REF", value: "FCRA § 623 — Furnisher Accuracy", dim: false },
          { label: "STATUS", value: "ANOMALY DETECTED IN PAYMENT HISTORY", blue: true },
          { label: "GENERATING", value: "Dispute Packet — Priority: HIGH", dim: false },
          { label: "MAIL", value: "Certified letter queued via USPS tracking", mail: true },
        ].map(({ label, value, blue, mail, dim }) => (
          <div key={label} style={{ display: "flex", gap: "8px", fontSize: "0.65rem", lineHeight: "1.5" }}>
            <span style={{ color: "rgba(255,255,255,0.28)", minWidth: "80px", flexShrink: 0 }}>{label}</span>
            <span style={{
              color: blue ? "#2563FF" : mail ? "#4ade80" : dim ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.72)",
              fontWeight: blue || mail ? 600 : 400,
              textShadow: blue ? "0 0 10px rgba(37,99,255,0.6)" : mail ? "0 0 8px rgba(74,222,128,0.4)" : "none",
            }}>{value}</span>
          </div>
        ))}
      </div>
      {/* Status bar */}
      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>BUILT FROM YOUR DOCUMENT · NOT A TEMPLATE</span>
        <span style={{ fontSize: "0.6rem", color: "#2563FF", letterSpacing: "0.08em", fontWeight: 600 }}>READY</span>
      </div>
    </div>
  )
}

/* ─── 3D Stacked-bars visual ─────────────────────────────────────────────── */

function EqualBarsVisual() {
  return (
    <div
      className="relative"
      style={{
        width: "320px",
        height: "320px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient glow behind the bars */}
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background:
            "radial-gradient(ellipse at 55% 50%, rgba(37,99,255,0.22) 0%, rgba(37,99,255,0.06) 45%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* Bars group — perspective + tilt applied to container */}
      <div
        style={{
          perspective: "900px",
          perspectiveOrigin: "50% 50%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            transform: "rotateX(26deg) rotateY(-18deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <Bar3D variant="white" />
          <Bar3D variant="blue" />
          <Bar3D variant="white" />
        </div>
      </div>

      {/* Floor glow reflection from the blue bar */}
      <div
        style={{
          position: "absolute",
          bottom: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "28px",
          background:
            "radial-gradient(ellipse at center, rgba(37,99,255,0.55) 0%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />
    </div>
  )
}

const BAR_W = 248
const BAR_H = 54
const BAR_DEPTH = 26

function Bar3D({ variant }: { variant: "white" | "blue" }) {
  const isBlue = variant === "blue"

  const frontBg = isBlue
    ? "#2563FF"
    : "linear-gradient(180deg, #EDF2FF 0%, #C8D8FF 100%)"

  const topBg = isBlue
    ? "linear-gradient(180deg, #5A8FFF 0%, #3D6FFF 100%)"
    : "linear-gradient(180deg, #FFFFFF 0%, #DDE7FF 100%)"

  const rightBg = isBlue
    ? "linear-gradient(90deg, #1A44CC 0%, #0E2B90 100%)"
    : "linear-gradient(90deg, #8FA8D8 0%, #6080B8 100%)"

  const frontShadow = isBlue
    ? "0 0 36px rgba(37,99,255,0.9), 0 0 70px rgba(37,99,255,0.55), inset 0 1px 0 rgba(180,210,255,0.35)"
    : "0 0 14px rgba(180,210,255,0.18)"

  return (
    <div
      style={{
        position: "relative",
        width: `${BAR_W}px`,
        height: `${BAR_H}px`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Front face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: frontBg,
          boxShadow: frontShadow,
        }}
      />

      {/* Top face — rotates 90° back from the top edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${BAR_W}px`,
          height: `${BAR_DEPTH}px`,
          background: topBg,
          transform: "rotateX(-90deg)",
          transformOrigin: "top center",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Right face — rotates 90° inward from the right edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: `${BAR_DEPTH}px`,
          height: `${BAR_H}px`,
          background: rightBg,
          transform: "rotateY(90deg)",
          transformOrigin: "right center",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  )
}
