export function SettledLogo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`group inline-flex items-center ${className}`} aria-label="SETTLED home">
      <span className="text-[12px] font-medium tracking-[0.58em] text-white [font-family:var(--font-plus-jakarta-sans)]">
        S
      </span>
      <span className="mx-[6px] flex h-[8px] w-[13px] flex-col justify-between" aria-hidden="true">
        <span className="h-[1px] rounded-full bg-white/90" />
        <span className="h-[1px] rounded-full bg-[#2563FF] shadow-[0_0_12px_rgba(37,99,255,0.6)]" />
        <span className="h-[1px] rounded-full bg-white/90" />
      </span>
      <span className="text-[12px] font-medium tracking-[0.58em] text-white [font-family:var(--font-plus-jakarta-sans)]">
        TTLED
      </span>
    </a>
  )
}
