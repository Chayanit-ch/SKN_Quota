/**
 * Local-storage-backed pub/sub used only when Firebase isn't configured (`isFirebaseConfigured`
 * is false), so /staff, /dashboard, and /admin stay fully interactive during development.
 * Writes in another tab arrive via the native `storage` event; writes in the same tab are
 * broadcast manually since `storage` doesn't fire on the tab that wrote the value.
 */

type Listener = () => void

const listeners = new Map<string, Set<Listener>>()

function notify(key: string) {
  for (const fn of listeners.get(key) ?? []) fn()
}

export function subscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)?.add(fn)
  return () => {
    listeners.get(key)?.delete(fn)
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  notify(key)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) notify(e.key)
  })
}
