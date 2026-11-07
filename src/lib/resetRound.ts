import { httpsCallable } from 'firebase/functions'
import { logAudit } from './auditLog'
import { functions, isFirebaseConfigured } from './firebase'
import { readJSON, writeJSON } from './mockStore'

interface ResetRoundResult {
  deletedCount: number
}

/**
 * Hard-deletes every entry for the round and clears its public stats. Calls the `resetRound`
 * Cloud Function (functions/src/index.ts) when Firebase is configured; otherwise clears the
 * local mock store the same way, so the confirmation flow can be exercised in development.
 */
export async function resetRound(
  year: number,
  confirmName: string,
  actor: { uid: string; name: string },
): Promise<ResetRoundResult> {
  if (confirmName !== String(year)) {
    throw new Error('ชื่อรอบการรับสมัครที่พิมพ์ยืนยันไม่ถูกต้อง')
  }

  if (functions) {
    const call = httpsCallable<{ year: string; confirmName: string }, ResetRoundResult>(functions, 'resetRound')
    const { data } = await call({ year: String(year), confirmName })
    return data
  }

  const entriesKey = `mock:entries:${year}`
  const entries = readJSON<unknown[]>(entriesKey, [])
  writeJSON(entriesKey, [])
  writeJSON(`mock:stats:${year}`, {})

  await logAudit({
    action: 'round.reset',
    target: `rounds/${year}`,
    by: actor.uid,
    byName: actor.name,
    detail: `รีเซ็ตข้อมูลผู้สมัครของรอบ ${year} (ลบทั้งหมด ${entries.length} รายการ)`,
  })

  return { deletedCount: entries.length }
}

export const resetRoundDisabledReason = isFirebaseConfigured ? null : 'โหมดทดสอบในเครื่อง: จะล้างเฉพาะข้อมูลจำลองในเบราว์เซอร์นี้'
