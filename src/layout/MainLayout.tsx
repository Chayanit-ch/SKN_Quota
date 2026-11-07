import { NavLink, Outlet } from 'react-router-dom'
import { CURRENT_ACADEMIC_YEAR } from '../config/round'
import { setMockRole, useAuth } from '../contexts/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { useTheme } from '../hooks/useTheme'

const ROLE_LABELS: Record<string, string> = { admin: 'ผู้ดูแลระบบ', staff: 'ครู' }

function AuthStatus() {
  const { uid, profile, signOut } = useAuth()
  if (!uid || !profile) return null

  return (
    <div className="flex items-center gap-2 text-sm text-navy/80">
      <span className="rounded-full bg-blue-soft px-2 py-0.5 text-xs font-medium text-blue">
        {ROLE_LABELS[profile.role] ?? profile.role}
      </span>
      <span className="hidden sm:inline">{profile.name}</span>
      {!isFirebaseConfigured && (
        <button
          type="button"
          onClick={() => setMockRole(profile.role === 'admin' ? 'staff' : 'admin')}
          className="h-9 rounded-[var(--radius-control)] border border-dashed border-line px-3 text-xs font-medium text-navy/60 hover:bg-blue-soft"
          title="สลับบทบาททดสอบ (แสดงเฉพาะตอนยังไม่เชื่อมต่อ Firebase)"
        >
          สลับบทบาททดสอบ
        </button>
      )}
      <button
        type="button"
        onClick={signOut}
        className="h-9 rounded-[var(--radius-control)] border border-line px-3 text-sm font-medium text-navy hover:bg-blue-soft"
      >
        ออกจากระบบ
      </button>
    </div>
  )
}

const navItems = [
  { to: '/', label: 'ตรวจสอบสิทธิ์' },
  { to: '/plans', label: 'เกณฑ์การรับสมัคร' },
  { to: '/dashboard', label: 'แดชบอร์ด' },
  { to: '/staff', label: 'สำหรับครู' },
  { to: '/admin', label: 'ผู้ดูแลระบบ' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex h-11 items-center rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-blue-soft text-blue'
      : 'text-navy/70 hover:bg-blue-soft hover:text-navy',
  ].join(' ')
}

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col bg-bg text-navy">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-semibold leading-tight sm:text-lg">
              ระบบรับโควตา ม.4 · โรงเรียนสมุทรสาครบูรณะ
            </span>
            <span className="rounded-full bg-blue-soft px-2 py-0.5 text-xs font-medium text-blue">
              ปีการศึกษา {CURRENT_ACADEMIC_YEAR}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <AuthStatus />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-line text-navy hover:bg-blue-soft"
              aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
