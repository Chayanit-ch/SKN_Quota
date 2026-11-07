import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { db } from '../lib/firebase'
import { subscribeEntries } from '../lib/entries'
import type { PublicPlanStats, PublicStats } from '../types/firestore'
import type { StudyPlan } from '../types/plan'

const EMPTY_STATS: PublicPlanStats = { count: 0, real: 0, reserve: 0 }

/**
 * Live, public read of `public/stats_{year}` — aggregate counts only, no applicant identity.
 * When Firebase isn't configured, `plans` (seats) lets this derive the same shape locally from
 * the mock entries store, mirroring what the real Cloud Function (functions/src/index.ts)
 * computes, so the dashboard and student pages stay meaningfully testable in development.
 */
export function usePublicStats(year: number = CURRENT_ACADEMIC_YEAR, plans?: StudyPlan[]) {
  const [stats, setStats] = useState<PublicStats>({})
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (db) {
      const ref = doc(db, 'public', `stats_${year}`)
      return onSnapshot(
        ref,
        (snap) => {
          setStats((snap.data() as PublicStats | undefined) ?? {})
          setConnected(true)
        },
        (error) => {
          console.error('[usePublicStats]', error)
          setConnected(false)
        },
      )
    }

    if (!plans || plans.length === 0) {
      setConnected(false)
      return
    }
    const seatsByPlan = new Map(plans.map((p) => [p.id, p.seats]))
    return subscribeEntries(year, (entries) => {
      const counts = new Map<string, number>()
      for (const entry of entries) {
        if (entry.deleted) continue
        counts.set(entry.planId, (counts.get(entry.planId) ?? 0) + 1)
      }
      const next: PublicStats = {}
      for (const [planId, seats] of seatsByPlan) {
        const count = counts.get(planId) ?? 0
        next[planId] = { count, real: Math.min(count, seats), reserve: Math.max(0, count - seats) }
      }
      setStats(next)
      setConnected(true)
    })
  }, [year, plans])

  return { stats, connected }
}

export function getPlanStats(stats: PublicStats, planId: string): PublicPlanStats {
  return stats[planId] ?? EMPTY_STATS
}
