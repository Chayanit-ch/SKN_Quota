import type { PublicPlanStats } from '../types/firestore'
import type { StudyPlan } from '../types/plan'

export function PlanSeatStats({ plan, stats }: { plan: StudyPlan; stats: PublicPlanStats }) {
  const over = stats.count - plan.seats

  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-medium text-navy">
        {over > 0 ? (
          <>
            เกินจำนวนที่นั่ง <span className="tabular-nums text-danger">{over}</span> คน
          </>
        ) : (
          <>
            ผู้ผ่านเกณฑ์ <span className="tabular-nums text-blue">{stats.real}</span> / {plan.seats} ที่นั่ง
          </>
        )}
      </p>
      <p className="text-navy/60">
        อัตราแข่งขัน: <span className="tabular-nums">{stats.count}</span> ผู้ผ่านเกณฑ์ (ผู้สมัครอันดับ 1) /{' '}
        <span className="tabular-nums">{plan.seats}</span> ที่นั่ง
      </p>
      <p className="text-xs text-navy/50">การรับเข้าจริงพิจารณาจากผลการเรียน ไม่ใช่ลำดับการสมัคร</p>
    </div>
  )
}
