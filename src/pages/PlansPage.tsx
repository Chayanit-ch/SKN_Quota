import { PlanCriteriaCard } from '../components/PlanCriteriaCard'
import { usePlans } from '../hooks/usePlans'
import { getPlanStats, usePublicStats } from '../hooks/usePublicStats'

export default function PlansPage() {
  const { plans } = usePlans()
  const { stats } = usePublicStats(undefined, plans)

  return (
    <section className="flex flex-1 flex-col gap-4 pb-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">เกณฑ์การรับสมัครทั้ง 10 แผนการเรียน</h1>
        <p className="mt-1 max-w-prose text-sm text-navy/70">
          ดูเกณฑ์ขั้นต่ำและลำดับวิชาที่ใช้ตัดสินกรณีคะแนนเท่ากันของแต่ละแผนการเรียน โดยไม่ต้องกรอกเกรด
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCriteriaCard key={plan.id} plan={plan} stats={getPlanStats(stats, plan.id)} />
        ))}
      </div>
    </section>
  )
}
