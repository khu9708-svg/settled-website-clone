"use client"

import type { ReactNode } from "react"

export function Reveal({
  children,
  delay: _delay = 0,
  y: _y = 30,
  className = "",
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
