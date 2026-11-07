import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { SEED_PLANS } from '../data/plans'
import type { StudyPlan } from '../types/plan'
import { db } from './firebase'
import { readJSON, subscribe, writeJSON } from './mockStore'

function mockKey(year: number) {
  return `mock:plans:${year}`
}

/** Live read of `rounds/{year}/plans` — the single source of truth every page shares. */
export function subscribePlans(year: number, onChange: (plans: StudyPlan[]) => void) {
  if (db) {
    const q = query(collection(db, 'rounds', String(year), 'plans'), orderBy('order'))
    return onSnapshot(
      q,
      (snap) => onChange(snap.empty ? SEED_PLANS : snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudyPlan)),
      (error) => {
        console.error('[subscribePlans]', error)
        onChange(SEED_PLANS)
      },
    )
  }
  const key = mockKey(year)
  const emit = () => onChange(readJSON<StudyPlan[]>(key, SEED_PLANS))
  emit()
  return subscribe(key, emit)
}

export async function savePlan(year: number, plan: StudyPlan) {
  if (db) {
    await setDoc(doc(db, 'rounds', String(year), 'plans', plan.id), plan)
    return
  }
  const key = mockKey(year)
  const current = readJSON<StudyPlan[]>(key, SEED_PLANS)
  const next = current.some((p) => p.id === plan.id)
    ? current.map((p) => (p.id === plan.id ? plan : p))
    : [...current, plan]
  writeJSON(key, next)
}

/** Persists a full reordering/renumbering of every plan's `order` field in one go. */
export async function saveAllPlans(year: number, plans: StudyPlan[]) {
  const dbInstance = db
  if (dbInstance) {
    await Promise.all(
      plans.map((plan) => setDoc(doc(dbInstance, 'rounds', String(year), 'plans', plan.id), plan)),
    )
    return
  }
  writeJSON(mockKey(year), plans)
}

/** Seeds `rounds/{toYear}/plans` from the given plans for the admin's "new round" flow. */
export async function copyPlansToYear(toYear: number, plans: StudyPlan[]) {
  await saveAllPlans(toYear, plans)
}
