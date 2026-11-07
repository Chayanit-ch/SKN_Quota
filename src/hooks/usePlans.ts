import { useEffect, useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { SEED_PLANS } from '../data/plans'
import { subscribePlans } from '../lib/plansStore'
import type { StudyPlan } from '../types/plan'

/**
 * Reads `rounds/{year}/plans` in real time (or the local mock store / seed data when
 * Firebase isn't configured), so every page stays in sync with admin edits.
 */
export function usePlans(year: number = CURRENT_ACADEMIC_YEAR) {
  const [plans, setPlans] = useState<StudyPlan[]>(SEED_PLANS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribePlans(year, (next) => {
      setPlans(next)
      setLoading(false)
    })
  }, [year])

  return { plans, loading }
}
