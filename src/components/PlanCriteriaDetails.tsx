import { SUBJECT_LABELS } from '../data/subjects'
import type { StudyPlan } from '../types/plan'

export function PlanCriteriaDetails({ plan }: { plan: StudyPlan }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-navy">
      <div>
        <p className="font-medium text-navy/80">เกณฑ์ขั้นต่ำ</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-navy/70">
          <li>
            GPA สะสม <span className="tabular-nums">≥ {plan.minGpa.toFixed(2)}</span>
          </li>
          {plan.minSubjects.map((req) => (
            <li key={req.subject}>
              {SUBJECT_LABELS[req.subject]} <span className="tabular-nums">≥ {req.min.toFixed(2)}</span>
            </li>
          ))}
          {plan.minSubjects.length === 0 && <li>ไม่กำหนดเกรดรายวิชาขั้นต่ำ</li>}
        </ul>
      </div>
      <div>
        <p className="font-medium text-navy/80">ลำดับวิชาที่ใช้ตัดสินกรณีคะแนนเท่ากัน</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-navy/70">
          {plan.tieBreak.map((subject) => (
            <li key={subject}>{SUBJECT_LABELS[subject]}</li>
          ))}
        </ol>
      </div>
      {plan.notes && (
        <p className="rounded-[var(--radius-control)] bg-yellow-soft px-3 py-2 text-navy">{plan.notes}</p>
      )}
    </div>
  )
}
