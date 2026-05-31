"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SettledLogo } from "./logo"

const solutionItems = [
  { label: "Student Loans", href: "/student-loans", flagship: true },
  { label: "Credit", href: "/disputes" },
  { label: "Business", href: "/business" },
]

const navItems = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/support" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050816]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <SettledLogo />
        </div>

        <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary navigation">
          <div className="group relative">
            <a
              href="/#solutions"
              className="flex items-center gap-1 text-[11px] font-medium text-white/68 transition-colors hover:text-white"
            >
              Solutions
              <ChevronDown className="size-3 text-white/40 transition group-hover:text-white/65" />
            </a>
            <div className="invisible absolute left-1/2 top-7 w-52 -translate-x-1/2 rounded-xl border border-white/10 bg-[#050816]/98 p-2 opacity-0 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl transition group-hover:visible group-hover:opacity-100">
              {solutionItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-xs font-semibold text-white/68 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-[11px] font-medium transition-colors ${
                isActive(item.href) ? "text-white" : "text-white/68 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a href="/support" className="text-[11px] font-medium text-white/68 transition-colors hover:text-white">
            About
          </a>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="outline" className="h-[30px] rounded-[6px] border-white/[0.12] bg-transparent px-4 text-[11px] font-medium text-white/80 shadow-none hover:bg-white/[0.05] hover:text-white">
            <a href="/login">Log In</a>
          </Button>
          <Button asChild className="h-[30px] rounded-[6px] bg-[#2563FF] px-4 text-[11px] font-semibold text-white shadow-[0_0_18px_rgba(37,99,255,0.38)] hover:bg-[#2563FF]/90">
            <a href="/get-started">Get Started</a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-white/10 bg-black lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col px-4 py-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Solutions</p>
            <div className="grid gap-2">
              {solutionItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-[#2563FF]/55"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-white/45" />
                </a>
              ))}
            </div>
            <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Platform</p>
            <div className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-bold text-white/80 transition-colors hover:border-white/25 hover:text-white"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-white/35" />
                </a>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
                <a href="/login" onClick={() => setOpen(false)}>Log In</a>
              </Button>
              <Button asChild className="w-full bg-[#2563FF] font-semibold text-white hover:bg-[#2563FF]/90">
                <a href="/get-started" onClick={() => setOpen(false)}>Get Started</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
