import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

initializeApp()
const db = getFirestore()

/**
 * Keeps `public/stats_{year}` in sync whenever an entry is created or soft-deleted.
 * This is the only writer of that document — firestore.rules blocks direct client writes.
 */
export const onEntryWritten = onDocumentWritten('rounds/{year}/entries/{entryId}', async (event) => {
  const before = event.data?.before?.data()
  const after = event.data?.after?.data()
  const planId = (after?.planId ?? before?.planId) as string | undefined
  const { year } = event.params as { year: string }
  if (!planId) return

  const planSnap = await db.doc(`rounds/${year}/plans/${planId}`).get()
  const seats = (planSnap.data()?.seats as number) ?? 0

  const countSnap = await db
    .collection(`rounds/${year}/entries`)
    .where('planId', '==', planId)
    .where('deleted', '==', false)
    .count()
    .get()
  const count = countSnap.data().count

  await db.doc(`public/stats_${year}`).set(
    {
      [planId]: {
        count,
        real: Math.min(count, seats),
        reserve: Math.max(0, count - seats),
      },
    },
    { merge: true },
  )
})

interface ResetRoundRequest {
  year: string
  confirmName: string
}

/**
 * Hard-deletes all entries for a round and clears its public stats. Only callable by an
 * admin, and only after the client has made the admin type the round name to confirm.
 */
export const resetRound = onCall<ResetRoundRequest>(async (request) => {
  const email = request.auth?.token.email?.toLowerCase()
  if (!email) throw new HttpsError('unauthenticated', 'ต้องเข้าสู่ระบบ')

  const userSnap = await db.doc(`users/${email}`).get()
  if (userSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'ต้องเป็นผู้ดูแลระบบเท่านั้น')
  }

  const { year, confirmName } = request.data
  if (confirmName !== year) {
    throw new HttpsError('invalid-argument', 'ชื่อรอบการรับสมัครที่พิมพ์ยืนยันไม่ถูกต้อง')
  }

  const roundRef = db.doc(`rounds/${year}`)
  if (!(await roundRef.get()).exists) {
    throw new HttpsError('not-found', 'ไม่พบรอบการรับสมัครนี้')
  }

  const entriesSnap = await db.collection(`rounds/${year}/entries`).get()
  const batchSize = 400
  for (let i = 0; i < entriesSnap.docs.length; i += batchSize) {
    const batch = db.batch()
    for (const d of entriesSnap.docs.slice(i, i + batchSize)) batch.delete(d.ref)
    await batch.commit()
  }

  await db.doc(`public/stats_${year}`).set({})

  await db.collection('auditLogs').add({
    action: 'round.reset',
    target: `rounds/${year}`,
    by: request.auth!.uid,
    byName: request.auth?.token.name ?? email,
    at: new Date(),
    detail: `รีเซ็ตข้อมูลผู้สมัครของรอบ ${year} (ลบทั้งหมด ${entriesSnap.size} รายการ)`,
  })

  return { deletedCount: entriesSnap.size }
})
