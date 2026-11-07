import { useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../../config/round'
import { useAuth } from '../../contexts/AuthContext'
import { usePlans } from '../../hooks/usePlans'
import { useRound, setRoundOpen } from '../../hooks/useRound'
import { logAudit } from '../../lib/auditLog'
import { copyPlansToYear } from '../../lib/plansStore'

export function RoundSettings() {
  const { uid, profile } = useAuth()
  const round = useRound()
  const { plans } = usePlans()
  const [copying, setCopying] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  async function handleToggleOpen() {
    const next = !round.isOpen
    await setRoundOpen(CURRENT_ACADEMIC_YEAR, next)
    await logAudit({
      action: 'round.update',
      target: `rounds/${CURRENT_ACADEMIC_YEAR}`,
      by: uid ?? 'unknown',
      byName: profile?.name ?? 'ผู้ดูแลระบบ',
      detail: next ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร',
    })
  }

  async function handleCopyToNextYear() {
    setCopying(true)
    setCopyMessage(null)
    try {
      const nextYear = CURRENT_ACADEMIC_YEAR + 1
      await copyPlansToYear(nextYear, plans)
      await logAudit({
        action: 'round.update',
        target: `rounds/${nextYear}`,
        by: uid ?? 'unknown',
        byName: profile?.name ?? 'ผู้ดูแลระบบ',
        detail: `สร้างรอบรับสมัครปี ${nextYear} โดยคัดลอกการตั้งค่าแผนการเรียนจากปี ${CURRENT_ACADEMIC_YEAR}`,
      })
      setCopyMessage(`คัดลอกการตั้งค่าแผนการเรียนไปยังปีการศึกษา ${nextYear} เรียบร้อยแล้ว`)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-navy">การตั้งค่ารอบรับสมัคร</h2>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <div>
          <p className="font-medium text-navy">ปีการศึกษา {CURRENT_ACADEMIC_YEAR}</p>
          <p className="text-sm text-navy/60">
            สถานะ: {round.isOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัครแล้ว'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleOpen}
          className={[
            'h-11 rounded-[var(--radius-control)] px-4 text-sm font-medium',
            round.isOpen ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success',
          ].join(' ')}
        >
          {round.isOpen ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
        <p className="font-medium text-navy">เริ่มรอบรับสมัครปีถัดไป</p>
        <p className="text-sm text-navy/60">
          คัดลอกการตั้งค่าแผนการเรียนทั้งหมดจากปี {CURRENT_ACADEMIC_YEAR} ไปยังปี {CURRENT_ACADEMIC_YEAR + 1}
        </p>
        <button
          type="button"
          disabled={copying}
          onClick={handleCopyToNextYear}
          className="h-11 w-fit rounded-[var(--radius-control)] bg-blue px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          คัดลอกไปยังปี {CURRENT_ACADEMIC_YEAR + 1}
        </button>
        {copyMessage && <p className="text-sm text-success">{copyMessage}</p>}
      </div>
    </div>
  )
}
