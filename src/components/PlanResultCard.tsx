import type { EligibilityResult } from '../lib/eligibility'
import { SUBJECT_LABELS } from '../data/subjects'
import type { PublicPlanStats } from '../types/firestore'
import { ExpandableCard } from './ExpandableCard'
import { PlanCriteriaDetails } from './PlanCriteriaDetails'
import { PlanSeatStats } from './PlanSeatStats'

const MISSING_LABELS: Record<string, string> = {
  gpa: 'GPA สะสม',
  ...SUBJECT_LABELS,
}

function StatusBadge({ status }: { status: EligibilityResult['status'] }) {
  if (status === 'eligible') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-sm font-medium text-success">
        <span aria-hidden="true">✓</span> ผ่านเกณฑ์
      </span>
    )
  }
  if (status === 'incomplete') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-sm font-medium text-navy/70">
        <span aria-hidden="true">?</span> ข้อมูลไม่ครบ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-sm font-medium text-danger">
      <span aria-hidden="true">✕</span> ไม่ผ่านเกณฑ์
    </span>
  )
}

export function PlanResultCard({
  result,
  stats,
}: {
  result: EligibilityResult
  stats: PublicPlanStats
}) {
  const { plan, status, missingFields, gpaShortfall, subjectShortfalls } = result

  return (
    <ExpandableCard
      header={
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-semibold text-navy">{plan.name}</h3>
              <p className="text-sm text-navy/60">
                {plan.shortName} · {plan.seats} ที่นั่ง
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {status === 'incomplete' && (
            <p className="text-sm text-navy/70">
              ต้องกรอกเพิ่มเติม: {missingFields.map((f) => MISSING_LABELS[f]).join(', ')}
            </p>
          )}

          {status === 'ineligible' && (
            <ul className="space-y-0.5 text-sm text-danger">
              {gpaShortfall > 0 && (
                <li>
                  {plan.shortName}: GPA ต่ำกว่าเกณฑ์ขั้นต่ำ <span className="tabular-nums">{gpaShortfall.toFixed(2)}</span>
                </li>
              )}
              {subjectShortfalls.map((s) => (
                <li key={s.subject}>
                  {plan.shortName}: วิชา{SUBJECT_LABELS[s.subject]}ต่ำกว่าเกณฑ์ขั้นต่ำ{' '}
                  <span className="tabular-nums">{s.shortfall.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          {plan.notes && <p className="rounded-[var(--radius-control)] bg-yellow-soft px-3 py-2 text-sm text-navy">{plan.notes}</p>}

          <PlanSeatStats plan={plan} stats={stats} />
        </div>
      }
    >
      <PlanCriteriaDetails plan={plan} />
    </ExpandableCard>
  )
}
