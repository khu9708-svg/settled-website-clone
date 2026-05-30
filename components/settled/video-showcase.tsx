"use client"

import { useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

const cinematicDemo = {
  title: "Forensic workflow: upload to dispute letter",
  description:
    "Upload a credit or student-loan report, review flagged reporting errors with cited statutes, and generate a document-specific dispute letter in one session.",
  src: "/videos/typing-laptop-2.mp4",
  label: "SETTLED workflow — document upload through letter output",
} as const

const workflowSteps = [
  {
    code: "01",
    title: "Upload or paste",
    body: "PDF, Word, or pasted bureau text enters the unified intake terminal.",
  },
  {
    code: "02",
    title: "Deterministic scan",
    body: "Reporting errors, balance mismatches, and date conflicts surface with statute references.",
  },
  {
    code: "03",
    title: "Review findings",
    body: "Confirm flagged items, severity, and next-step routing before letter generation.",
  },
  {
    code: "04",
    title: "Generate and send",
    body: "Document-specific dispute output with certified-mail delivery tracking when selected.",
  },
] as const

const alsoCovers = [
  {
    title: "Forensic credit audit",
    body: "FCRA dispute workflows for collections, charge-offs, balance errors, and bureau validation failures.",
  },
  {
    title: "Tax liens & business credit",
    body: "Tax lien date errors, D&B, PAYDEX, and vendor tradeline misreporting.",
  },
  {
    title: "ChexSystems, LexisNexis, EWS",
    body: "Auxiliary bureau intake plus certified-mail delivery evidence and escalation record.",
  },
] as const

function CinematicPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPlaying(true)
      return
    }
    video.pause()
    setPlaying(false)
  }

  return (
    <article className="relative min-w-0">
      <div className="overflow-hidden border border-[#2563EB]/35 bg-[#050816] shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_28px_100px_rgba(0,0,0,0.75)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#050816] px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7BA4FF]">{cinematicDemo.label}</p>
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 sm:block">16:9</p>
        </div>
        <div className="relative">
          <video
            ref={videoRef}
            className="aspect-video w-full bg-black object-cover"
            src={cinematicDemo.src}
            controls={playing}
            playsInline
            preload="metadata"
            aria-label={cinematicDemo.title}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
          {!playing ? (
            <button
              type="button"
              onClick={togglePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              aria-label={`Play ${cinematicDemo.title}`}
            >
              <span className="flex size-8 items-center justify-center border border-[#2563EB]/70 bg-[#050816]/90 shadow-[0_0_18px_rgba(37,99,235,0.45)] transition hover:border-[#2563EB] hover:shadow-[0_0_26px_rgba(37,99,235,0.65)]">
                <Play className="ml-0.5 size-3.5 fill-white text-white" />
              </span>
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 bg-[#050816] px-3 py-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="flex size-7 items-center justify-center border border-[#2563EB]/45 bg-black/60 text-white shadow-[0_0_12px_rgba(37,99,235,0.25)] transition hover:border-[#2563EB] hover:shadow-[0_0_18px_rgba(37,99,235,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563EB]"
            aria-label={playing ? "Pause workflow demo" : "Play workflow demo"}
          >
            {playing ? <Pause className="size-3" /> : <Play className="ml-0.5 size-3 fill-white" />}
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
            {playing ? "Playing" : "Press play for full workflow"}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <h3 className="text-lg font-semibold text-white">{cinematicDemo.title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{cinematicDemo.description}</p>
      </div>
    </article>
  )
}

export function VideoShowcase() {
  return (
    <section id="watch-settled" className="scroll-mt-20 border-y border-white/[0.08] bg-black">
      <div className="mx-auto max-w-[1200px] px-4 py-16">
        <div className="grid gap-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Watch SETTLED in Action</p>
            <h2 className="mt-4 text-pretty text-3xl font-semibold leading-[1.05] text-white md:text-[44px]">
              One cinematic workflow. Upload to delivery.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
              A single guided pass from document intake through forensic findings, statute mapping, and dispute-letter
              output — no duplicate clips or broken placeholders.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
            <CinematicPlayer />
            <aside className="border border-white/10 bg-[#050816] p-5 lg:sticky lg:top-24">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Workflow steps</p>
              <ol className="mt-5 space-y-4">
                {workflowSteps.map((step) => (
                  <li key={step.code} className="grid grid-cols-[36px_1fr] gap-3 border-l border-[#2563EB]/40 pl-3">
                    <span className="text-xs font-bold tracking-[0.16em] text-[#7BA4FF]">{step.code}</span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{step.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/55">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <div className="border border-[#2563EB]/25 bg-[#050816] p-5 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA4FF]">Also covered in SETTLED</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {alsoCovers.map((item) => (
                <li key={item.title} className="border-l-2 border-[#2563EB] pl-4">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
