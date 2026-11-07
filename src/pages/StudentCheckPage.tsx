import { useEffect, useMemo, useState } from 'react'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { GradeInput } from '../components/GradeInput'
import { PlanResultCard } from '../components/PlanResultCard'
import { SUBJECT_LABELS, SUBJECT_ORDER } from '../data/subjects'
import { usePlans } from '../hooks/usePlans'
import { getPlanStats, usePublicStats } from '../hooks/usePublicStats'
import { checkAllPlans, type Grades } from '../lib/eligibility'

const STORAGE_KEY = 'quota-counter:grades'

interface StoredData {
  gpa?: number
  grades: Grades
}

export default function StudentCheckPage() {
  const { plans } = usePlans()
  const { stats } = usePublicStats(undefined, plans)

  const [gpa, setGpa] = useState<number | undefined>(undefined)
  const [grades, setGrades] = useState<Grades>({})
  const [remember, setRemember] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Load any previously remembered values once on mount. This is the only place the app
  // reads from localStorage — grades never touch the network.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed: StoredData = JSON.parse(raw)
      setGpa(parsed.gpa)
      setGrades(parsed.grades ?? {})
      setRemember(true)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gpa, grades } satisfies StoredData))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [remember, gpa, grades])

  function handleClear() {
    setGpa(undefined)
    setGrades({})
    setShowResults(false)
    setRemember(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const results = useMemo(() => checkAllPlans(plans, { gpa, grades }), [plans, gpa, grades])

  return (
    <section className="flex flex-1 flex-col gap-6 pb-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">ตรวจสอบสิทธิ์เข้าเรียน ม.4</h1>
        <p className="mt-1 max-w-prose text-sm text-navy/70">
          กรอก GPA และเกรดเฉลี่ยรายวิชาเพื่อตรวจสอบว่าผ่านเกณฑ์แผนการเรียนใดบ้าง ข้อมูลทั้งหมดประมวลผลบนอุปกรณ์ของนักเรียนเท่านั้น
          ไม่มีการส่งเกรดไปยังเซิร์ฟเวอร์หรือบันทึกลงระบบ
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <GradeInput
          id="gpa"
          label="GPA สะสม"
          value={gpa}
          onChange={setGpa}
          helperText="GPA สะสม 5 ภาคเรียน (ม.1 ถึง ม.3 ภาคเรียนที่ 1) ดูได้จากหลังใบ ปพ.1"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {SUBJECT_ORDER.map((subject) => (
            <GradeInput
              key={subject}
              id={`subject-${subject}`}
              label={SUBJECT_LABELS[subject]}
              value={grades[subject]}
              onChange={(v) => setGrades((g) => ({ ...g, [subject]: v }))}
            />
          ))}
        </div>
        <p className="text-xs text-navy/60">
          เกรดรายวิชาคือค่าเฉลี่ยของวิชานั้นตลอดทุกภาคเรียน (รวมรายวิชาพื้นฐานและเพิ่มเติม) ตามที่คำนวณไว้แล้วในหลังใบ ปพ.1
          กรอกตัวเลขตามที่ปรากฏได้ทันที หากไม่ทราบให้เว้นว่างไว้ (ระบบจะถือว่ายังไม่ทราบค่า ไม่ใช่ 0)
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy/80">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-5 w-5 rounded border-line"
        />
        จดจำข้อมูลไว้ในเครื่องนี้ (บันทึกเฉพาะในเบราว์เซอร์ของนักเรียนเท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์)
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="h-11 flex-1 rounded-[var(--radius-control)] bg-blue px-4 text-base font-semibold text-white hover:opacity-90"
        >
          ตรวจสอบสิทธิ์
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="h-11 rounded-[var(--radius-control)] border border-line px-4 text-base font-medium text-navy hover:bg-blue-soft"
        >
          ล้างข้อมูล
        </button>
      </div>

      {showResults && (
        <div className="flex flex-col gap-4">
          <DisclaimerBanner />
          {results.map((result) => (
            <PlanResultCard key={result.plan.id} result={result} stats={getPlanStats(stats, result.plan.id)} />
          ))}
        </div>
      )}
    </section>
  )
}
