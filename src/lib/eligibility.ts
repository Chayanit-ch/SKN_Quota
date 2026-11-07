import type { StudyPlan, Subject } from '../types/plan'

/** `undefined` means the student has not entered a value for that field (not the same as 0). */
export type Grades = Partial<Record<Subject, number>>

export interface EligibilityInput {
  gpa?: number
  grades: Grades
}

export interface SubjectShortfall {
  subject: Subject
  required: number
  entered: number
  /** Minimum required grade - entered grade, rounded to 2 decimal places. Always > 0. */
  shortfall: number
}

export type EligibilityStatus = 'eligible' | 'ineligible' | 'incomplete'

export interface EligibilityResult {
  plan: StudyPlan
  status: EligibilityStatus
  /** Fields the student still needs to fill in. Only populated when status is 'incomplete'. */
  missingFields: ('gpa' | Subject)[]
  /** > 0 only when status is 'ineligible' and GPA is below the minimum. */
  gpaShortfall: number
  /** Only populated when status is 'ineligible'. */
  subjectShortfalls: SubjectShortfall[]
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Pure, local-only eligibility check for a single study plan. Never call this with data
 * that has left the student's device — see the privacy requirements in the spec.
 */
export function checkEligibility(plan: StudyPlan, input: EligibilityInput): EligibilityResult {
  const missingFields: ('gpa' | Subject)[] = []

  if (input.gpa === undefined) {
    missingFields.push('gpa')
  }
  for (const requirement of plan.minSubjects) {
    if (input.grades[requirement.subject] === undefined) {
      missingFields.push(requirement.subject)
    }
  }

  if (missingFields.length > 0) {
    return {
      plan,
      status: 'incomplete',
      missingFields,
      gpaShortfall: 0,
      subjectShortfalls: [],
    }
  }

  const gpa = input.gpa as number
  const gpaShortfall = gpa < plan.minGpa ? round2(plan.minGpa - gpa) : 0

  const subjectShortfalls: SubjectShortfall[] = []
  for (const requirement of plan.minSubjects) {
    const entered = input.grades[requirement.subject] as number
    if (entered < requirement.min) {
      subjectShortfalls.push({
        subject: requirement.subject,
        required: requirement.min,
        entered,
        shortfall: round2(requirement.min - entered),
      })
    }
  }

  const eligible = gpaShortfall === 0 && subjectShortfalls.length === 0

  return {
    plan,
    status: eligible ? 'eligible' : 'ineligible',
    missingFields: [],
    gpaShortfall,
    subjectShortfalls,
  }
}

const STATUS_RANK: Record<EligibilityStatus, number> = {
  eligible: 0,
  ineligible: 1,
  incomplete: 2,
}

/**
 * Evaluates every active plan and sorts the results with eligible plans first,
 * per the spec's display order. Ties are broken by the plan's configured `order`.
 */
export function checkAllPlans(plans: StudyPlan[], input: EligibilityInput): EligibilityResult[] {
  return plans
    .filter((plan) => plan.active)
    .map((plan) => checkEligibility(plan, input))
    .sort((a, b) => {
      const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (statusDiff !== 0) return statusDiff
      return a.plan.order - b.plan.order
    })
}
