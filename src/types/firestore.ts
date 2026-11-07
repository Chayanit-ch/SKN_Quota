import type { Timestamp } from 'firebase/firestore'
import type { Subject } from './plan'

export interface Round {
  year: number
  isOpen: boolean
  createdAt: Timestamp
  /** Max number of ranked study-plan preferences a student may submit. Default 3. */
  maxChoices: number
}

/** One document per individual counting action — never an accumulated total. Soft-deleted. */
export interface Entry {
  id: string
  planId: string
  createdAt: Timestamp
  createdBy: string
  createdByName: string
  /** Reserved for the future student-ID integration phase. */
  studentId?: string
  deleted: boolean
  deletedBy?: string | null
  deletedAt?: Timestamp | null
}

export interface PublicPlanStats {
  /** Total non-deleted entries for the plan (= eligible / first-choice applicants). */
  count: number
  /** min(count, seats) */
  real: number
  /** max(0, count - seats) */
  reserve: number
}

export type PublicStats = Record<string, PublicPlanStats>

export interface AppUser {
  email: string
  name: string
  role: 'admin' | 'staff'
}

export interface AuditLog {
  id: string
  action: 'entry.add' | 'entry.delete' | 'plan.edit' | 'round.update' | 'user.edit' | 'round.reset'
  target: string
  by: string
  byName: string
  at: Timestamp
  detail?: string
}

/** Seeded by future Excel/CSV import; not editable through the UI yet. */
export interface StudentRecord {
  studentId: string
  name: string
  room: string
  gpa: number
  grades: Partial<Record<Subject, number>>
}
