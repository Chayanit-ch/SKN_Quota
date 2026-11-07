import { useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../../config/round'
import { useAuth } from '../../contexts/AuthContext'
import { usePlans } from '../../hooks/usePlans'
import { logAudit } from '../../lib/auditLog'
import { savePlan } from '../../lib/plansStore'
import type { StudyPlan } from '../../types/plan'
import { PlanEditorForm } from './PlanEditorForm'

export function PlansManager() {
  const { uid, profile } = useAuth()
  const { plans } = usePlans()
  const [editing, setEditing] = useState<StudyPlan | null | 'new'>(null)

  async function handleSave(plan: StudyPlan) {
    await savePlan(CURRENT_ACADEMIC_YEAR, plan)
    await logAudit({
      action: 'plan.edit',
      target: `plan:${plan.id}`,
      by: uid ?? 'unknown',
      byName: profile?.name ?? 'ผู้ดูแลระบบ',
      detail: `แก้ไขข้อมูลแผน ${plan.name}`,
    })
    setEditing(null)
  }

  async function toggleActive(plan: StudyPlan) {
    await savePlan(CURRENT_ACADEMIC_YEAR, { ...plan, active: !plan.active })
    await logAudit({
      action: 'plan.edit',
      target: `plan:${plan.id}`,
      by: uid ?? 'unknown',
      byName: profile?.name ?? 'ผู้ดูแลระบบ',
      detail: plan.active ? `ซ่อนแผน ${plan.name}` : `เปิดใช้งานแผน ${plan.name}`,
    })
  }

  if (editing) {
    return (
      <PlanEditorForm
        initial={editing === 'new' ? null : editing}
        nextOrder={plans.length}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-navy">แผนการเรียนทั้งหมด</h2>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="h-11 rounded-[var(--radius-control)] bg-blue px-4 text-sm font-medium text-white hover:opacity-90"
        >
          + เพิ่มแผนการเรียน
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-navy">
                {plan.name} <span className="text-navy/50">({plan.shortName})</span>
              </p>
              <p className="text-sm text-navy/60">
                {plan.seats} ที่นั่ง · GPA ≥ {plan.minGpa.toFixed(2)} ·{' '}
                {plan.active ? 'เปิดใช้งาน' : 'ซ่อนอยู่'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleActive(plan)}
                className="h-9 rounded-[var(--radius-control)] border border-line px-3 text-sm font-medium text-navy hover:bg-blue-soft"
              >
                {plan.active ? 'ซ่อน' : 'เปิดใช้งาน'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(plan)}
                className="h-9 rounded-[var(--radius-control)] bg-blue-soft px-3 text-sm font-medium text-blue"
              >
                แก้ไข
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
