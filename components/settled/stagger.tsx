"use client"

import type { ReactNode } from "react"

/**
 * Stagger
 * Wraps each direct child in a motion item so they cascade in one-by-one
 * when the group scrolls into view. Uses a manual IntersectionObserver
 * (whileInView is unreliable in this preview environment).
 *
 * Drop it AROUND a stack of elements (intro copy) or REPLACE a grid/flex
 * container `<div>` — each child becomes an animated cell.
 */
export function Stagger({
  children,
  className = "",
  y: _y = 24,
  step: _step = 0.08,
  duration: _duration = 0.5,
}: {
  children: ReactNode
  className?: string
  y?: number
  step?: number
  duration?: number
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
