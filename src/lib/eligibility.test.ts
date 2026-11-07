import { describe, expect, it } from 'vitest'
import { checkAllPlans, checkEligibility } from './eligibility'
import { SEED_PLANS } from '../data/plans'
import type { StudyPlan } from '../types/plan'

const mathComputer = SEED_PLANS.find((p) => p.id === 'com') as StudyPlan
const mathScience = SEED_PLANS.find((p) => p.id === 'sci') as StudyPlan
const englishChinese = SEED_PLANS.find((p) => p.id === 'chn') as StudyPlan
const digitalCommerce = SEED_PLANS.find((p) => p.id === 'biz') as StudyPlan

describe('checkEligibility', () => {
  it('returns incomplete when GPA is missing', () => {
    const result = checkEligibility(mathScience, { grades: { math: 3.0, science: 3.0 } })
    expect(result.status).toBe('incomplete')
    expect(result.missingFields).toContain('gpa')
  })

  it('returns incomplete when a required subject grade is missing, treating it as unknown (not 0)', () => {
    const result = checkEligibility(mathScience, { gpa: 3.0, grades: { math: 3.0 } })
    expect(result.status).toBe('incomplete')
    expect(result.missingFields).toEqual(['science'])
  })

  it('is eligible when GPA and all subject minimums are met exactly (>= boundary)', () => {
    const result = checkEligibility(mathComputer, {
      gpa: 2.5,
      grades: { math: 2.5, computer: 3.0 },
    })
    expect(result.status).toBe('eligible')
    expect(result.subjectShortfalls).toHaveLength(0)
    expect(result.gpaShortfall).toBe(0)
  })

  it('reports the exact shortfall amount, rounded to 2 decimals, for a failing subject', () => {
    const result = checkEligibility(mathComputer, {
      gpa: 2.75,
      grades: { math: 2.75, computer: 2.5 },
    })
    expect(result.status).toBe('ineligible')
    expect(result.subjectShortfalls).toEqual([
      { subject: 'computer', required: 3.0, entered: 2.5, shortfall: 0.5 },
    ])
  })

  it('reports a GPA shortfall separately from subject shortfalls', () => {
    const result = checkEligibility(mathComputer, {
      gpa: 2.0,
      grades: { math: 2.5, computer: 3.0 },
    })
    expect(result.status).toBe('ineligible')
    expect(result.gpaShortfall).toBe(0.5)
    expect(result.subjectShortfalls).toHaveLength(0)
  })

  it('handles floating point rounding correctly (0.1 + 0.2 style errors)', () => {
    const result = checkEligibility(mathComputer, {
      gpa: 2.5,
      grades: { math: 2.5, computer: 2.9 },
    })
    expect(result.subjectShortfalls[0].shortfall).toBe(0.1)
  })

  it('is eligible for a plan with no subject requirements once GPA is met', () => {
    const result = checkEligibility(digitalCommerce, { gpa: 2.0, grades: {} })
    expect(result.status).toBe('eligible')
  })

  it('treats a plan with no subject requirements as incomplete only if GPA is missing', () => {
    const result = checkEligibility(digitalCommerce, { grades: {} })
    expect(result.status).toBe('incomplete')
    expect(result.missingFields).toEqual(['gpa'])
  })

  it('only requires english for English-Chinese, not other subjects', () => {
    const result = checkEligibility(englishChinese, { gpa: 2.25, grades: { english: 2.0 } })
    expect(result.status).toBe('eligible')
  })
})

describe('checkAllPlans', () => {
  it('sorts eligible plans before ineligible and incomplete plans', () => {
    // Meets sci (2.75/2.75/2.75) but not com's computer requirement, and gpa unknown for others
    // only math+science entered.
    const results = checkAllPlans(SEED_PLANS, {
      gpa: 2.8,
      grades: { math: 2.8, science: 2.8, computer: 1.0, english: 2.8, thai: 2.8, social: 2.8 },
    })
    const statuses = results.map((r) => r.status)
    const firstIneligibleIndex = statuses.indexOf('ineligible')
    const lastEligibleIndex = statuses.lastIndexOf('eligible')
    if (firstIneligibleIndex !== -1 && lastEligibleIndex !== -1) {
      expect(lastEligibleIndex).toBeLessThan(firstIneligibleIndex)
    }
    expect(results.find((r) => r.plan.id === 'sci')?.status).toBe('eligible')
    expect(results.find((r) => r.plan.id === 'com')?.status).toBe('ineligible')
  })

  it('excludes inactive plans', () => {
    const hiddenPlan = { ...mathScience, id: 'hidden', active: false }
    const results = checkAllPlans([hiddenPlan], { gpa: 4.0, grades: { math: 4.0, science: 4.0 } })
    expect(results).toHaveLength(0)
  })
})
