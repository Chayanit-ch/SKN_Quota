export type Subject =
  | 'math'
  | 'science'
  | 'english'
  | 'thai'
  | 'social'
  | 'computer'
  | 'art'
  | 'pe'

export interface MinSubjectRequirement {
  subject: Subject
  min: number
}

/** Mirrors Firestore `rounds/{year}/plans/{id}` — the single source of truth for every page. */
export interface StudyPlan {
  id: string
  name: string
  shortName: string
  seats: number
  minGpa: number
  minSubjects: MinSubjectRequirement[]
  notes?: string
  tieBreak: Subject[]
  order: number
  active: boolean
}
