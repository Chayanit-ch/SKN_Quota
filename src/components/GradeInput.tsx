import { useEffect, useState } from 'react'

interface GradeInputProps {
  id: string
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  helperText?: string
}

/** Strips to at most one leading digit (0-4) and two decimal places while typing. */
function sanitize(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '')
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replaceAll('.', '')
  }
  const [intPart, decPart] = v.split('.')
  let result = intPart.slice(0, 1)
  if (decPart !== undefined) result += '.' + decPart.slice(0, 2)
  return result
}

/**
 * Numeric grade input restricted to 0.00–4.00 with up to 2 decimals.
 * An empty field means "unknown", never 0 — `onChange` receives `undefined` for empty input.
 */
export function GradeInput({ id, label, value, onChange, helperText }: GradeInputProps) {
  const [text, setText] = useState(value !== undefined ? value.toFixed(2) : '')

  // Matches the format handleBlur writes, so a round-trip through onChange doesn't
  // clobber the just-formatted text with an unformatted number.
  useEffect(() => {
    setText(value !== undefined ? value.toFixed(2) : '')
  }, [value])

  function handleBlur() {
    if (text === '' || text === '.') {
      setText('')
      onChange(undefined)
      return
    }
    const parsed = Math.min(4, Math.max(0, Number.parseFloat(text)))
    const rounded = Math.round(parsed * 100) / 100
    setText(rounded.toFixed(2))
    onChange(rounded)
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={text}
        onChange={(e) => setText(sanitize(e.target.value))}
        onBlur={handleBlur}
        className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3 text-base text-navy tabular-nums outline-none focus:border-blue focus:ring-2 focus:ring-blue-soft"
      />
      {helperText && <p className="text-xs text-navy/60">{helperText}</p>}
    </div>
  )
}
