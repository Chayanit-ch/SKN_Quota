import { ExpandableCard } from './ExpandableCard'
import { PlanCriteriaDetails } from './PlanCriteriaDetails'
import { PlanSeatStats } from './PlanSeatStats'
import type { PublicPlanStats } from '../types/firestore'
import type { StudyPlan } from '../types/plan'

export function PlanCriteriaCard({ plan, stats }: { plan: StudyPlan; stats: PublicPlanStats }) {
  return (
    <ExpandableCard
      header={
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="font-heading text-lg font-semibold text-navy">{plan.name}</h3>
            <p className="text-sm text-navy/60">
              {plan.shortName} · {plan.seats} ที่นั่ง
            </p>
          </div>
          <PlanSeatStats plan={plan} stats={stats} />
        </div>
      }
    >
      <PlanCriteriaDetails plan={plan} />
    </ExpandableCard>
  )
}
