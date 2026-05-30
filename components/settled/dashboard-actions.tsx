"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface DashboardActionsProps {
  email: string
}

export function DashboardActions({ email }: DashboardActionsProps) {
  return (
    <div className="mt-8 border border-white/12 bg-[#030303] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">Signed In Account</p>
          <p className="mt-1 text-sm font-semibold text-white/70">{email}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[640px]">
          <Button asChild className="h-11 rounded-none bg-[#2563EB] text-sm font-bold uppercase tracking-[0.06em] text-white hover:bg-[#2563EB]/90">
            <a href="/student-loans">Student Scan</a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-none border-white/15 bg-transparent text-sm font-bold uppercase tracking-[0.06em] text-white hover:bg-white/10">
            <a href="/disputes">Credit Scan</a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-none border-white/15 bg-transparent text-sm font-bold uppercase tracking-[0.06em] text-white hover:bg-white/10">
            <a href="/pricing">Plan / Billing</a>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-11 rounded-none border-white/15 bg-transparent text-sm font-bold uppercase tracking-[0.06em] text-white hover:bg-white/10"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
