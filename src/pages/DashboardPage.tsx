import { useEffect, useRef, useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { usePlans } from '../hooks/usePlans'
import { usePulse } from '../hooks/usePulse'
import { getPlanStats, usePublicStats } from '../hooks/usePublicStats'
import type { PublicPlanStats } from '../types/firestore'
import type { StudyPlan } from '../types/plan'

const TOTAL_SEATS = 320

function getStatus(real: number, seats: number) {
  const remaining = seats - real
  if (remaining <= 0) return { label: 'เต็มแล้ว', className: 'bg-danger/10 text-danger' }
  if (remaining <= 3) return { label: `ใกล้เต็ม · เหลือ ${remaining} ที่นั่ง`, className: 'bg-yellow-soft text-navy' }
  return { label: `เหลือ ${remaining} ที่นั่ง`, className: 'bg-success/10 text-success' }
}

function FlashNumber({ value, className }: { value: number; className?: string }) {
  const pulsing = usePulse(value)
  return (
    <span className={['tabular-nums rounded px-1', pulsing ? 'flash-update' : '', className].join(' ')}>{value}</span>
  )
}

function PlanDashboardCard({ plan, stats }: { plan: StudyPlan; stats: PublicPlanStats }) {
  const status = getStatus(stats.real, plan.seats)
  const progress = Math.min(100, (stats.real / plan.seats) * 100)

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-semibold text-navy">{plan.shortName}</h3>
          <p className="text-xs text-navy/60">{plan.seats} ที่นั่ง</p>
        </div>
        <span className={['rounded-full px-2 py-0.5 text-xs font-medium', status.className].join(' ')}>
          {status.label}
        </span>
      </div>

      <FlashNumber value={stats.real} className="font-heading text-4xl font-bold text-blue" />

      <div className="h-2.5 overflow-hidden rounded-full bg-blue-soft">
        <div className="h-full rounded-full bg-blue transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-sm text-navy/70">
        สำรอง <FlashNumber value={stats.reserve} className="font-medium" /> คน
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { plans } = usePlans()
  const { stats, connected } = usePublicStats(CURRENT_ACADEMIC_YEAR, plans)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLastUpdated(new Date())
  }, [stats])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await containerRef.current?.requestFullscreen()
    }
  }

  const totals = plans.reduce(
    (acc, plan) => {
      const s = getPlanStats(stats, plan.id)
      acc.real += s.real
      acc.reserve += s.reserve
      acc.total += s.count
      if (s.real >= plan.seats && plan.seats > 0) acc.full += 1
      return acc
    },
    { real: 0, reserve: 0, total: 0, full: 0 },
  )

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-bg text-navy">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-6">
        <h1 className="font-heading text-lg font-semibold sm:text-xl">
          แดชบอร์ดรับโควตา ม.4 · ปีการศึกษา {CURRENT_ACADEMIC_YEAR}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-navy/60">
            อัปเดตล่าสุด{' '}
            <span className="tabular-nums">{lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </span>
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            ].join(' ')}
          >
            <span aria-hidden="true">●</span> {connected ? 'เชื่อมต่อแล้ว' : 'ขาดการเชื่อมต่อ'}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-10 rounded-[var(--radius-control)] border border-line px-3 text-sm font-medium text-navy hover:bg-blue-soft"
          >
            {isFullscreen ? 'ออกจากเต็มจอ' : 'แสดงเต็มจอ'}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-center">
            <p className="text-xs text-navy/60">ตัวจริงรวม</p>
            <FlashNumber value={totals.real} className="font-heading text-2xl font-bold text-blue sm:text-3xl" />
            <span className="text-sm text-navy/60"> / {TOTAL_SEATS}</span>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-center">
            <p className="text-xs text-navy/60">สำรองรวม</p>
            <FlashNumber value={totals.reserve} className="font-heading text-2xl font-bold text-navy sm:text-3xl" />
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-center">
            <p className="text-xs text-navy/60">ผู้สมัครรวม</p>
            <FlashNumber value={totals.total} className="font-heading text-2xl font-bold text-navy sm:text-3xl" />
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-center">
            <p className="text-xs text-navy/60">แผนที่เต็มแล้ว</p>
            <FlashNumber value={totals.full} className="font-heading text-2xl font-bold text-danger sm:text-3xl" />
            <span className="text-sm text-navy/60"> / {plans.length}</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 [@media(orientation:landscape)]:grid-cols-5">
          {plans.map((plan) => (
            <PlanDashboardCard key={plan.id} plan={plan} stats={getPlanStats(stats, plan.id)} />
          ))}
        </div>
      </main>
    </div>
  )
}
