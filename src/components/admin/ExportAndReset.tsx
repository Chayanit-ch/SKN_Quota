import { useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../../config/round'
import { useAuth } from '../../contexts/AuthContext'
import { usePlans } from '../../hooks/usePlans'
import { usePublicStats } from '../../hooks/usePublicStats'
import { exportSummaryToExcel } from '../../lib/exportExcel'
import { resetRound, resetRoundDisabledReason } from '../../lib/resetRound'

export function ExportAndReset() {
  const { uid, profile } = useAuth()
  const { plans } = usePlans()
  const { stats } = usePublicStats(CURRENT_ACADEMIC_YEAR, plans)
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [showResetForm, setShowResetForm] = useState(false)

  const expectedConfirm = String(CURRENT_ACADEMIC_YEAR)

  async function handleReset() {
    if (!uid || !profile) return
    setResetting(true)
    setResultMessage(null)
    try {
      const result = await resetRound(CURRENT_ACADEMIC_YEAR, confirmText, { uid, name: profile.name })
      setResultMessage(`ล้างข้อมูลเรียบร้อยแล้ว (ลบ ${result.deletedCount} รายการ)`)
      setConfirmText('')
      setShowResetForm(false)
    } catch (e) {
      setResultMessage(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold text-navy">ส่งออกข้อมูลสรุป</h2>
        <p className="text-sm text-navy/60">ส่งออกเฉพาะจำนวนสรุปรายแผนการเรียนเป็นไฟล์ Excel ไม่มีข้อมูลรายบุคคล</p>
        <button
          type="button"
          onClick={() => exportSummaryToExcel(plans, stats, CURRENT_ACADEMIC_YEAR)}
          className="h-11 w-fit rounded-[var(--radius-control)] bg-blue px-4 text-sm font-medium text-white hover:opacity-90"
        >
          ส่งออกเป็น Excel
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4">
        <h2 className="font-heading text-lg font-semibold text-danger">รีเซ็ตข้อมูลรอบรับสมัคร</h2>
        <p className="text-sm text-navy/70">
          ลบข้อมูลผู้สมัครทั้งหมดของปีการศึกษา {CURRENT_ACADEMIC_YEAR} อย่างถาวร ใช้สำหรับล้างข้อมูลทดสอบก่อนวันรับสมัครจริงเท่านั้น
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        {resetRoundDisabledReason && <p className="text-xs text-navy/50">{resetRoundDisabledReason}</p>}

        {!showResetForm ? (
          <button
            type="button"
            onClick={() => setShowResetForm(true)}
            className="h-11 w-fit rounded-[var(--radius-control)] border border-danger px-4 text-sm font-medium text-danger hover:bg-danger/10"
          >
            เริ่มรีเซ็ตข้อมูล
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              พิมพ์ "{expectedConfirm}" เพื่อยืนยัน
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-11 w-full max-w-xs rounded-[var(--radius-control)] border border-line bg-bg px-3"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={resetting || confirmText !== expectedConfirm}
                onClick={handleReset}
                className="h-11 rounded-[var(--radius-control)] bg-danger px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                ยืนยันลบข้อมูลทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false)
                  setConfirmText('')
                }}
                className="h-11 rounded-[var(--radius-control)] border border-line px-4 text-sm text-navy"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
        {resultMessage && <p className="text-sm text-navy">{resultMessage}</p>}
      </div>
    </div>
  )
}
