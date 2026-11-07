import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { logAudit } from './auditLog'
import { readJSON, subscribe, writeJSON } from './mockStore'

/** Normalized view of a Firestore `Entry` with `createdAt`/`deletedAt` resolved to `Date`. */
export interface EntryView {
  id: string
  planId: string
  createdAt: Date
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedBy?: string | null
  deletedAt?: Date | null
}

interface MockEntryRecord {
  id: string
  planId: string
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedBy: string | null
  deletedAt: string | null
}

function mockKey(year: number) {
  return `mock:entries:${year}`
}

function toView(record: MockEntryRecord): EntryView {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
  }
}

/** Live view of every entry for the round, newest first. Falls back to a localStorage mock. */
export function subscribeEntries(year: number, onChange: (entries: EntryView[]) => void) {
  if (db) {
    const q = query(collection(db, 'rounds', String(year), 'entries'), orderBy('createdAt', 'desc'), limit(1000))
    return onSnapshot(q, (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            planId: data.planId,
            createdAt: (data.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            deleted: data.deleted,
            deletedBy: data.deletedBy ?? null,
            deletedAt: (data.deletedAt as Timestamp | undefined)?.toDate() ?? null,
          } satisfies EntryView
        }),
      )
    })
  }

  const key = mockKey(year)
  const emit = () => {
    const records = readJSON<MockEntryRecord[]>(key, [])
    onChange(records.map(toView).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
  }
  emit()
  return subscribe(key, emit)
}

export async function addEntry(year: number, planId: string, user: { uid: string; name: string }) {
  if (db) {
    await addDoc(collection(db, 'rounds', String(year), 'entries'), {
      planId,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByName: user.name,
      deleted: false,
      deletedBy: null,
      deletedAt: null,
    })
  } else {
    const key = mockKey(year)
    const records = readJSON<MockEntryRecord[]>(key, [])
    const record: MockEntryRecord = {
      id: crypto.randomUUID(),
      planId,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      createdByName: user.name,
      deleted: false,
      deletedBy: null,
      deletedAt: null,
    }
    writeJSON(key, [...records, record])
  }

  await logAudit({
    action: 'entry.add',
    target: `plan:${planId}`,
    by: user.uid,
    byName: user.name,
  })
}

/** Deletes (soft) the most recent non-deleted entry for the plan. Returns false if none exist. */
export async function deleteLatestEntry(
  year: number,
  planId: string,
  user: { uid: string; name: string },
): Promise<boolean> {
  if (db) {
    const q = query(
      collection(db, 'rounds', String(year), 'entries'),
      where('planId', '==', planId),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1),
    )
    const snap = await getDocs(q)
    const target = snap.docs[0]
    if (!target) return false
    await updateDoc(target.ref, { deleted: true, deletedBy: user.uid, deletedAt: serverTimestamp() })
  } else {
    const key = mockKey(year)
    const records = readJSON<MockEntryRecord[]>(key, [])
    const candidates = records
      .filter((r) => r.planId === planId && !r.deleted)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const target = candidates[0]
    if (!target) return false
    writeJSON(
      key,
      records.map((r) =>
        r.id === target.id ? { ...r, deleted: true, deletedBy: user.uid, deletedAt: new Date().toISOString() } : r,
      ),
    )
  }

  await logAudit({
    action: 'entry.delete',
    target: `plan:${planId}`,
    by: user.uid,
    byName: user.name,
  })
  return true
}

/**
 * Rank (1-based) of each non-deleted entry within its plan, ordered by creation time.
 * Only the latest entry per plan can ever be deleted, so this is always gap-free.
 */
export function computeEntryRanks(entries: EntryView[]): Map<string, number> {
  const ranks = new Map<string, number>()
  const byPlan = new Map<string, EntryView[]>()
  for (const entry of entries) {
    if (entry.deleted) continue
    if (!byPlan.has(entry.planId)) byPlan.set(entry.planId, [])
    byPlan.get(entry.planId)?.push(entry)
  }
  for (const list of byPlan.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    list.forEach((entry, index) => ranks.set(entry.id, index + 1))
  }
  return ranks
}
