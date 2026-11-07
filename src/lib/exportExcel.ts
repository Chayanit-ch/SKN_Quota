import * as XLSX from 'xlsx'
import type { PublicStats } from '../types/firestore'
import type { StudyPlan } from '../types/plan'
import { getPlanStats } from '../hooks/usePublicStats'

/**
 * Exports aggregate per-plan counts only (never individual applicant data) as an .xlsx file.
 * Only ever writes data we generated ourselves — this module must never call `XLSX.read` on
 * untrusted input; the `xlsx` package has known parser vulnerabilities with no npm-side fix.
 */
export function exportSummaryToExcel(plans: StudyPlan[], stats: PublicStats, year: number) {
  const rows = plans.map((plan) => {
    const s = getPlanStats(stats, plan.id)
    return {
      รหัสแผน: plan.id,
      แผนการเรียน: plan.name,
      ชื่อย่อ: plan.shortName,
      ที่นั่ง: plan.seats,
      ผู้ผ่านเกณฑ์ทั้งหมด: s.count,
      ตัวจริง: s.real,
      สำรอง: s.reserve,
    }
  })

  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'สรุปผู้สมัคร')
  XLSX.writeFile(workbook, `สรุปผู้สมัคร-${year}.xlsx`)
}
