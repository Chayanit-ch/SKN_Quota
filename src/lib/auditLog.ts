import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase'
import { readJSON, subscribe, writeJSON } from './mockStore'
import type { AuditLog } from '../types/firestore'

const MOCK_KEY = 'mock:auditLogs'

export async function logAudit(entry: Omit<AuditLog, 'id' | 'at'>) {
  if (db) {
    await addDoc(collection(db, 'auditLogs'), { ...entry, at: serverTimestamp() })
    return
  }
  const logs = readJSON<AuditLog[]>(MOCK_KEY, [])
  const record: AuditLog = { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() as unknown as AuditLog['at'] }
  writeJSON(MOCK_KEY, [record, ...logs].slice(0, 500))
}

/** Append-only audit trail. `planId` filters logs whose `target` references that plan. */
export function subscribeAuditLogs(onChange: (logs: AuditLog[]) => void, planId?: string) {
  if (db) {
    const constraints = planId
      ? [where('target', '==', `plan:${planId}`), orderBy('at', 'desc')]
      : [orderBy('at', 'desc')]
    const q = query(collection(db, 'auditLogs'), ...constraints)
    return onSnapshot(q, (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog))
    })
  }
  const emit = () => {
    const all = readJSON<AuditLog[]>(MOCK_KEY, [])
    onChange(planId ? all.filter((l) => l.target === `plan:${planId}`) : all)
  }
  emit()
  return subscribe(MOCK_KEY, emit)
}
