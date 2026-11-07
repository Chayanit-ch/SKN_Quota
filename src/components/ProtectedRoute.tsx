import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode
  requireRole?: 'admin'
}) {
  const { uid, profile, loading, error, signIn } = useAuth()

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-16 text-navy/60">กำลังตรวจสอบสิทธิ์...</div>
  }

  if (!uid || !profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="max-w-sm text-navy/70">ต้องเข้าสู่ระบบด้วยอีเมลของโรงเรียนที่ได้รับสิทธิ์จากผู้ดูแลระบบ</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="button"
          onClick={signIn}
          className="h-11 rounded-[var(--radius-control)] bg-blue px-6 font-medium text-white hover:opacity-90"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    )
  }

  if (requireRole && profile.role !== requireRole) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-center text-navy/70">
        บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้านี้
      </div>
    )
  }

  return <>{children}</>
}
