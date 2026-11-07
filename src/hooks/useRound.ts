import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { db } from '../lib/firebase'
import { readJSON, subscribe, writeJSON } from '../lib/mockStore'

export interface RoundState {
  isOpen: boolean
  maxChoices: number
}

const DEFAULT_ROUND: RoundState = { isOpen: true, maxChoices: 3 }

function mockKey(year: number) {
  return `mock:round:${year}`
}

export function useRound(year: number = CURRENT_ACADEMIC_YEAR) {
  const [round, setRound] = useState<RoundState>(DEFAULT_ROUND)

  useEffect(() => {
    if (db) {
      return onSnapshot(doc(db, 'rounds', String(year)), (snap) => {
        const data = snap.data()
        setRound({ isOpen: data?.isOpen ?? true, maxChoices: data?.maxChoices ?? 3 })
      })
    }
    const key = mockKey(year)
    const emit = () => setRound(readJSON(key, DEFAULT_ROUND))
    emit()
    return subscribe(key, emit)
  }, [year])

  return round
}

export async function setRoundOpen(year: number, isOpen: boolean) {
  if (db) {
    await setDoc(doc(db, 'rounds', String(year)), { year, isOpen, createdAt: serverTimestamp() }, { merge: true })
    return
  }
  const key = mockKey(year)
  writeJSON(key, { ...readJSON(key, DEFAULT_ROUND), isOpen })
}
