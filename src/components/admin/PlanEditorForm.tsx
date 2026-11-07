import { useRef, useState } from 'react'
import { SUBJECT_LABELS, SUBJECT_ORDER } from '../../data/subjects'
import type { StudyPlan, Subject } from '../../types/plan'

const EMPTY_PLAN: StudyPlan = {
  id: '',
  name: '',
  shortName: '',
  seats: 0,
  minGpa: 0,
  minSubjects: [],
  tieBreak: [],
  order: 0,
  active: true,
}

export function PlanEditorForm({
  initial,
  nextOrder,
  onSave,
  onCancel,
}: {
  initial: StudyPlan | null
  nextOrder: number
  onSave: (plan: StudyPlan) => void
  onCancel: () => void
}) {
  const [plan, setPlan] = useState<StudyPlan>(initial ?? { ...EMPTY_PLAN, order: nextOrder })
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const tieBreakItemRefs = useRef<(HTMLLIElement | null)[]>([])
  const isNew = !initial

  function toggleMinSubject(subject: Subject, checked: boolean) {
    setPlan((p) => ({
      ...p,
      minSubjects: checked
        ? [...p.minSubjects, { subject, min: 2.0 }]
        : p.minSubjects.filter((r) => r.subject !== subject),
    }))
  }

  function setMinSubjectValue(subject: Subject, min: number) {
    setPlan((p) => ({
      ...p,
      minSubjects: p.minSubjects.map((r) => (r.subject === subject ? { ...r, min } : r)),
    }))
  }

  function toggleTieBreak(subject: Subject, checked: boolean) {
    setPlan((p) => ({
      ...p,
      tieBreak: checked ? [...p.tieBreak, subject] : p.tieBreak.filter((s) => s !== subject),
    }))
  }

  function moveTieBreak(from: number, to: number) {
    setPlan((p) => {
      const next = [...p.tieBreak]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...p, tieBreak: next }
    })
  }

  // Pointer-based reordering (not native HTML5 drag-and-drop) so it works reliably on
  // touch/tablet input, not just desktop mouse drags.
  function handleDragPointerMove(e: React.PointerEvent) {
    if (draggingIndex === null) return
    const items = tieBreakItemRefs.current
    let targetIndex = items.length - 1
    for (let i = 0; i < items.length; i++) {
      const rect = items[i]?.getBoundingClientRect()
      if (rect && e.clientY < rect.top + rect.height / 2) {
        targetIndex = i
        break
      }
    }
    if (targetIndex !== draggingIndex) {
      moveTieBreak(draggingIndex, targetIndex)
      setDraggingIndex(targetIndex)
    }
  }

  function handleSubmit() {
    if (!plan.id.trim() || !plan.name.trim() || !plan.shortName.trim()) return
    onSave({ ...plan, id: plan.id.trim(), name: plan.name.trim(), shortName: plan.shortName.trim() })
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          รหัสแผน (ใช้ใน URL/ฐานข้อมูล ห้ามซ้ำ)
          <input
            disabled={!isNew}
            value={plan.id}
            onChange={(e) => setPlan((p) => ({ ...p, id: e.target.value.trim() }))}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3 disabled:opacity-60"
            placeholder="เช่น sci"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          จำนวนที่นั่ง
          <input
            type="number"
            min={0}
            value={plan.seats}
            onChange={(e) => setPlan((p) => ({ ...p, seats: Number(e.target.value) }))}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          ชื่อเต็มแผนการเรียน
          <input
            value={plan.name}
            onChange={(e) => setPlan((p) => ({ ...p, name: e.target.value }))}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          ชื่อย่อ
          <input
            value={plan.shortName}
            onChange={(e) => setPlan((p) => ({ ...p, shortName: e.target.value }))}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          GPA ขั้นต่ำ
          <input
            type="number"
            step={0.01}
            min={0}
            max={4}
            value={plan.minGpa}
            onChange={(e) => setPlan((p) => ({ ...p, minGpa: Number(e.target.value) }))}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={plan.active}
            onChange={(e) => setPlan((p) => ({ ...p, active: e.target.checked }))}
            className="h-5 w-5 rounded border-line"
          />
          เปิดใช้งาน (แสดงต่อนักเรียนและครู)
        </label>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-navy">เกรดรายวิชาขั้นต่ำ</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUBJECT_ORDER.map((subject) => {
            const req = plan.minSubjects.find((r) => r.subject === subject)
            return (
              <div key={subject} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-line px-2 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(req)}
                  onChange={(e) => toggleMinSubject(subject, e.target.checked)}
                  className="h-4 w-4 rounded border-line"
                />
                <span className="flex-1">{SUBJECT_LABELS[subject]}</span>
                {req && (
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={4}
                    value={req.min}
                    onChange={(e) => setMinSubjectValue(subject, Number(e.target.value))}
                    className="h-8 w-16 rounded border border-line px-1 tabular-nums"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-navy">ลำดับวิชาตัดสินกรณีคะแนนเท่ากัน (ลากเพื่อจัดลำดับ)</p>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_ORDER.filter((s) => !plan.tieBreak.includes(s)).map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => toggleTieBreak(subject, true)}
              className="h-9 rounded-full border border-dashed border-line px-3 text-sm text-navy/60 hover:bg-blue-soft"
            >
              + {SUBJECT_LABELS[subject]}
            </button>
          ))}
        </div>
        <ol className="mt-2 flex flex-col gap-1" onPointerMove={handleDragPointerMove}>
          {plan.tieBreak.map((subject, index) => (
            <li
              key={subject}
              ref={(el) => {
                tieBreakItemRefs.current[index] = el
              }}
              className={[
                'flex items-center gap-2 rounded-[var(--radius-control)] border bg-bg px-3 py-2 text-sm',
                draggingIndex === index ? 'border-blue bg-blue-soft' : 'border-line',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                onPointerDown={(e) => {
                  e.preventDefault()
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  setDraggingIndex(index)
                }}
                onPointerUp={() => setDraggingIndex(null)}
                className="cursor-grab touch-none text-navy/40 active:cursor-grabbing"
              >
                ⠿
              </span>
              <span className="w-6 tabular-nums text-navy/50">{index + 1}.</span>
              <span className="flex-1">{SUBJECT_LABELS[subject]}</span>
              <button
                type="button"
                onClick={() => toggleTieBreak(subject, false)}
                className="text-navy/40 hover:text-danger"
                aria-label="ลบออกจากลำดับ"
              >
                ✕
              </button>
            </li>
          ))}
          {plan.tieBreak.length === 0 && <p className="text-sm text-navy/50">ยังไม่ได้กำหนดลำดับ</p>}
        </ol>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        หมายเหตุเพิ่มเติม (ถ้ามี)
        <textarea
          value={plan.notes ?? ''}
          onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value || undefined }))}
          rows={2}
          className="rounded-[var(--radius-control)] border border-line bg-bg p-3 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="h-11 flex-1 rounded-[var(--radius-control)] bg-blue font-medium text-white hover:opacity-90"
        >
          บันทึก
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-[var(--radius-control)] border border-line px-4 font-medium text-navy"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
