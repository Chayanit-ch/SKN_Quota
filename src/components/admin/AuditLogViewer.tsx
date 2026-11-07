import { useEffect, useState } from 'react'
import { usePlans } from '../../hooks/usePlans'
import { subscribeAuditLogs } from '../../lib/auditLog'
import type { AuditLog } from '../../types/firestore'

const ACTION_LABELS: Record<AuditLog['action'], string> = {
  'entry.add': 'เพิ่มผู้สมัคร',
  'entry.delete': 'ลบรายการล่าสุด',
  'plan.edit': 'แก้ไขแผนการเรียน',
  'round.update': 'อัปเดตรอบรับสมัคร',
  'user.edit': 'แก้ไขผู้ใช้งาน',
  'round.reset': 'รีเซ็ตข้อมูลรอบรับสมัคร',
}

function formatAt(at: unknown): string {
  if (at && typeof at === 'object' && 'toDate' in at) {
    return (at as { toDate: () => Date }).toDate().toLocaleString('th-TH')
  }
  if (typeof at === 'string') return new Date(at).toLocaleString('th-TH')
  return '-'
}

export function AuditLogViewer() {
  const { plans } = usePlans()
  const [planFilter, setPlanFilter] = useState<string>('')
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => subscribeAuditLogs(setLogs, planFilter || undefined), [planFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-navy">บันทึกการใช้งาน</h2>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-10 rounded-[var(--radius-control)] border border-line bg-bg px-3 text-sm"
        >
          <option value="">ทุกแผนการเรียน</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shortName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-2 text-sm">
            <div className="flex items-center justify-between text-navy/60">
              <span>{formatAt(log.at)}</span>
              <span>{log.byName}</span>
            </div>
            <p className="text-navy">
              <span className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</span>
              {log.detail ? ` — ${log.detail}` : ''}
            </p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-sm text-navy/50">ไม่มีบันทึกการใช้งาน</p>}
      </div>
      <p className="text-xs text-navy/40">บันทึกการใช้งานไม่สามารถแก้ไขหรือลบได้</p>
    </div>
  )
}
