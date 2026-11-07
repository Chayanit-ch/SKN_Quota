import type { Subject } from '../types/plan'

export const SUBJECT_ORDER: Subject[] = [
  'math',
  'science',
  'english',
  'thai',
  'social',
  'computer',
  'art',
  'pe',
]

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'คณิตศาสตร์',
  science: 'วิทยาศาสตร์',
  english: 'ภาษาอังกฤษ',
  thai: 'ภาษาไทย',
  social: 'สังคมศึกษา',
  computer: 'คอมพิวเตอร์',
  art: 'ศิลปะ',
  pe: 'สุขศึกษาและพลศึกษา',
}
