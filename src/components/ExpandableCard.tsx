import { useState, type ReactNode } from 'react'

export function ExpandableCard({
  header,
  children,
  defaultOpen = false,
}: {
  header: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="p-4">{header}</div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-center gap-1 border-t border-line text-sm font-medium text-blue hover:bg-blue-soft"
      >
        {open ? 'ซ่อนรายละเอียด' : 'ดูเกณฑ์และลำดับการตัดสิน'}
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </div>
  )
}
