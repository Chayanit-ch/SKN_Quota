import { useState } from 'react'
import { AuditLogViewer } from '../components/admin/AuditLogViewer'
import { ExportAndReset } from '../components/admin/ExportAndReset'
import { PlansManager } from '../components/admin/PlansManager'
import { RoundSettings } from '../components/admin/RoundSettings'
import { UsersManager } from '../components/admin/UsersManager'

const TABS = [
  { id: 'plans', label: 'แผนการเรียน' },
  { id: 'round', label: 'รอบรับสมัคร' },
  { id: 'users', label: 'ผู้ใช้งาน' },
  { id: 'logs', label: 'บันทึกการใช้งาน' },
  { id: 'export', label: 'ส่งออก/รีเซ็ต' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>('plans')

  return (
    <section className="flex flex-1 flex-col gap-4 pb-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">จัดการระบบ (ผู้ดูแลระบบ)</h1>
        <p className="mt-1 text-sm text-navy/70">จัดการแผนการเรียน รอบการรับสมัคร ผู้ใช้งาน และบันทึกการใช้งาน</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'h-11 shrink-0 border-b-2 px-3 text-sm font-medium',
              tab === t.id ? 'border-blue text-blue' : 'border-transparent text-navy/60 hover:text-navy',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' && <PlansManager />}
      {tab === 'round' && <RoundSettings />}
      {tab === 'users' && <UsersManager />}
      {tab === 'logs' && <AuditLogViewer />}
      {tab === 'export' && <ExportAndReset />}
    </section>
  )
}
