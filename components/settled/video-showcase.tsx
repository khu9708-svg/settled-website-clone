import { PlayCircle } from "lucide-react"

const videos = [
  {
    title: "Credit report scan",
    src: "/videos/typing-laptop.mp4",
  },
  {
    title: "Document review workflow",
    src: "/videos/typing-laptop.mp4",
  },
  {
    title: "SETTLED workflow preview",
    src: "/videos/city-night.mp4",
  },
  {
    title: "Business credit engine",
    src: "/videos/city-night.mp4",
  },
]

export function VideoShowcase() {
  return (
    <section id="watch-settled" className="mx-auto max-w-[1200px] px-4 py-16 scroll-mt-20">
      <div className="grid gap-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">
            Watch SETTLED in Action
          </p>
          <h2 className="mt-4 text-pretty text-3xl font-semibold leading-[1.05] text-white md:text-[44px]">
            Four ways SETTLED turns reports into action.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
            From upload to analysis, SETTLED shows the errors, statutes, next steps, and delivery options in one
            guided workflow.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {videos.map((video) => (
            <div
              key={video.src}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-2xl shadow-[#2563EB]/10"
            >
              <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-black/55 px-4 py-3 backdrop-blur">
                <PlayCircle className="size-4 text-[#7BA4FF]" />
                <span className="text-xs font-semibold text-white/70">{video.title}</span>
              </div>
              <video
                className="aspect-video w-full bg-black object-cover pt-10"
                src={video.src}
                controls
                preload="metadata"
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
