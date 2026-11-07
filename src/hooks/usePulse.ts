import { useEffect, useRef, useState } from 'react'

/** Returns true for a brief moment after `value` changes — used to flash updated numbers. */
export function usePulse<T>(value: T): boolean {
  const [pulsing, setPulsing] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setPulsing(true)
    const timer = setTimeout(() => setPulsing(false), 900)
    return () => clearTimeout(timer)
  }, [value])

  return pulsing
}
