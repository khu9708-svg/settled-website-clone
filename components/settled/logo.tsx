export function SettledLogo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`group flex items-center ${className}`} aria-label="SETTLED home">
      <span className="text-[26px] font-medium tracking-[0.42em] text-white [font-family:var(--font-plus-jakarta-sans)]">
        S
      </span>
      <span className="mx-[10px] flex h-[18px] w-[28px] flex-col justify-between" aria-hidden="true">
        <span className="h-[3px] rounded-full bg-white/90" />
        <span className="h-[3px] rounded-full bg-[#2563EB] shadow-[0_0_18px_rgba(37,99,235,0.65)]" />
        <span className="h-[3px] rounded-full bg-white/90" />
      </span>
      <span className="text-[26px] font-medium tracking-[0.42em] text-white [font-family:var(--font-plus-jakarta-sans)]">
        TTLED
      </span>
    </a>
  )
}
