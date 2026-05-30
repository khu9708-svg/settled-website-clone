'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

const FALLBACK_OPERATOR = 'Operator Unassigned'

function toOperatorName(name?: string | null, email?: string | null) {
  const normalizedName = name?.trim()
  if (normalizedName) return normalizedName

  const normalizedEmail = email?.trim()
  if (normalizedEmail) return normalizedEmail.split('@')[0]

  return FALLBACK_OPERATOR
}

export function useForensicOperator() {
  const { data: session } = useSession()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return useMemo(() => {
    if (!hydrated) return FALLBACK_OPERATOR
    return toOperatorName(session?.user?.name, session?.user?.email)
  }, [hydrated, session?.user?.email, session?.user?.name])
}
