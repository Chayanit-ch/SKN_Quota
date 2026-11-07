import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { usePlans } from '../hooks/usePlans'
import { useRound } from '../hooks/useRound'
import { addEntry, computeEntryRanks, deleteLatestEntry, subscribeEntries, type EntryView } from '../lib/entries'
import type { StudyPlan } from '../types/plan'

const DEBOUNCE_MS = 350
const RECENT_ENTRIES_LIMIT = 15

function formatTime(date: Date) {
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function PlanCounterCard({
  plan,
  liveCount,
  roundOpen,
  onAdd,
  onDelete,
}: {
  plan: StudyPlan
  liveCount: number
  roundOpen: boolean
  onAdd: () => void
  onDelete: () => Promise<boolean>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const over = liveCount - plan.seats
  const real = Math.min(liveCount, plan.seats)
  const reserve = Math.max(0, over)
  const exceeded = over > 0

  async function handleConfirmDelete() {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-semibold text-navy">{plan.name}</h3>
          <p className="text-sm text-navy/60">{plan.shortName}</p>
        </div>
        <div className="text-right text-sm">
          <p className="tabular-nums font-medium text-blue">
            ตัวจริง {real} / {plan.seats}
          </p>
          <p className="tabular-nums text-navy/70">สำรอง {reserve} คน</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!roundOpen}
        onClick={onAdd}
        className={[
          'h-14 rounded-[var(--radius-control)] text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          exceeded ? 'bg-yellow text-navy hover:opacity-90' : 'bg-blue text-white hover:opacity-90',
        ].join(' ')}
      >
        + เพิ่มผู้สมัคร 1 คน
      </button>
      <p className="-mt-1 text-center text-sm text-navy/70">
        {exceeded ? (
          <>
            เกินจำนวนที่นั่ง <span className="tabular-nums font-medium text-danger">{over}</span> คน
          </>
        ) : (
          <>
            ผู้สมัครคนที่ <span className="tabular-nums font-medium text-navy">{liveCount}</span> จาก {plan.seats} ที่นั่ง
          </>
        )}
      </p>

      {confirming ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-yellow-soft p-2 text-sm text-navy">
          <span className="flex-1">ยืนยันลบรายการล่าสุดของ {plan.shortName}?</span>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirmDelete}
            className="h-9 rounded-[var(--radius-control)] bg-danger px-3 font-medium text-white disabled:opacity-50"
          >
            ยืนยันลบ
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-9 rounded-[var(--radius-control)] border border-line px-3 font-medium text-navy"
          >
            ยกเลิก
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!roundOpen || liveCount === 0}
          onClick={() => setConfirming(true)}
          className="h-11 rounded-[var(--radius-control)] border border-line text-sm font-medium text-navy hover:bg-blue-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          ลบรายการล่าสุด
        </button>
      )}
    </div>
  )
}

export default function StaffPage() {
  const { uid, profile } = useAuth()
  const { plans } = usePlans()
  const round = useRound()
  const [entries, setEntries] = useState<EntryView[]>([])
  const lastClickRef = useRef<Record<string, number>>({})

  useEffect(() => subscribeEntries(CURRENT_ACADEMIC_YEAR, setEntries), [])

  const activeEntries = useMemo(() => entries.filter((e) => !e.deleted), [entries])
  const countByPlan = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of activeEntries) counts.set(e.planId, (counts.get(e.planId) ?? 0) + 1)
    return counts
  }, [activeEntries])
  const ranks = useMemo(() => computeEntryRanks(entries), [entries])

  const currentUser = useMemo(() => {
    if (!uid || !profile) return null
    return { uid, name: profile.name }
  }, [uid, profile])

  function handleAdd(planId: string) {
    if (!currentUser) return
    const now = Date.now()
    const last = lastClickRef.current[planId] ?? 0
    if (now - last < DEBOUNCE_MS) return
    lastClickRef.current[planId] = now
    void addEntry(CURRENT_ACADEMIC_YEAR, planId, currentUser)
  }

  async function handleDelete(planId: string) {
    if (!currentUser) return false
    return deleteLatestEntry(CURRENT_ACADEMIC_YEAR, planId, currentUser)
  }

  const recentEntries = entries.slice(0, RECENT_ENTRIES_LIMIT)

  return (
    <section className="flex flex-1 flex-col gap-4 pb-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">นับจำนวนผู้สมัคร (สำหรับครู)</h1>
        <p className="mt-1 text-sm text-navy/70">
          นับเฉพาะผู้สมัครที่ตรวจสอบแล้วว่าผ่านเกณฑ์ และเลือกแผนการเรียนนี้เป็นอันดับ 1 เท่านั้น
        </p>
      </div>

      {!round.isOpen && (
        <div className="rounded-[var(--radius-card)] border border-yellow bg-yellow-soft px-4 py-3 text-sm text-navy">
          ปิดรับสมัครแล้วตามประกาศของผู้ดูแลระบบ ไม่สามารถเพิ่มหรือลบจำนวนผู้สมัครได้ในขณะนี้
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <PlanCounterCard
              key={plan.id}
              plan={plan}
              liveCount={countByPlan.get(plan.id) ?? 0}
              roundOpen={round.isOpen}
              onAdd={() => handleAdd(plan.id)}
              onDelete={() => handleDelete(plan.id)}
            />
          ))}
        </div>

        <aside className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 lg:sticky lg:top-4 lg:h-fit">
          <h2 className="font-heading text-base font-semibold text-navy">รายการล่าสุด</h2>
          {recentEntries.length === 0 && <p className="text-sm text-navy/50">ยังไม่มีรายการ</p>}
          <ul className="flex flex-col gap-2 text-sm">
            {recentEntries.map((entry) => {
              const plan = plans.find((p) => p.id === entry.planId)
              const rank = ranks.get(entry.id)
              return (
                <li key={entry.id} className="rounded-[var(--radius-control)] border border-line px-3 py-2">
                  <div className="flex items-center justify-between text-navy/60">
                    <span className="tabular-nums">{formatTime(entry.createdAt)}</span>
                    <span>{entry.createdByName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy">{plan?.shortName ?? entry.planId}</span>
                    {entry.deleted ? (
                      <span className="text-danger">ลบแล้ว</span>
                    ) : (
                      <span className="tabular-nums text-blue">ลำดับที่ {rank}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </section>
  )
}
