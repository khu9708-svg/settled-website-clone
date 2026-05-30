import { PUBLIC_CONFIG, supportMailtoHref } from '@/lib/public-config'

export function StatusBar() {
  return (
    <div className="settled-status-bar fixed bottom-0 left-0 z-50 hidden w-full border-t border-white/10 bg-black/92 px-4 py-2 backdrop-blur-xl md:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/54">
        <span>
          System: <span className="text-[#7BA4FF]">Online</span>
        </span>
        <span>
          Encryption: <span className="text-white">256-BIT</span>
        </span>
        <a href={supportMailtoHref()} className="text-[#7BA4FF] hover:text-white">
          {PUBLIC_CONFIG.supportEmail}
        </a>
      </div>
    </div>
  )
}
