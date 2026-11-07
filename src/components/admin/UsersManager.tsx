import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { logAudit } from '../../lib/auditLog'
import { deleteUser, saveUser, subscribeUsers } from '../../lib/usersStore'
import type { AppUser } from '../../types/firestore'

export function UsersManager() {
  const { uid, profile: me } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AppUser['role']>('staff')
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null)

  useEffect(() => subscribeUsers(setUsers), [])

  async function handleAdd() {
    if (!email.trim() || !name.trim()) return
    const user: AppUser = { email: email.trim().toLowerCase(), name: name.trim(), role }
    await saveUser(user)
    await logAudit({
      action: 'user.edit',
      target: `user:${user.email}`,
      by: uid ?? 'unknown',
      byName: me?.name ?? 'ผู้ดูแลระบบ',
      detail: `เพิ่มผู้ใช้ ${user.name} (${user.email}) บทบาท ${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครู'}`,
    })
    setEmail('')
    setName('')
    setRole('staff')
  }

  async function handleDelete(target: AppUser) {
    await deleteUser(target.email)
    await logAudit({
      action: 'user.edit',
      target: `user:${target.email}`,
      by: uid ?? 'unknown',
      byName: me?.name ?? 'ผู้ดูแลระบบ',
      detail: `ลบสิทธิ์ผู้ใช้ ${target.name} (${target.email})`,
    })
    setConfirmDeleteEmail(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-navy">จัดการผู้ใช้งาน</h2>

      <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          อีเมลโรงเรียน
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@sknb.ac.th"
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          ชื่อ-นามสกุล
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          บทบาท
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AppUser['role'])}
            className="h-11 rounded-[var(--radius-control)] border border-line bg-bg px-3"
          >
            <option value="staff">ครู</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="h-11 rounded-[var(--radius-control)] bg-blue px-4 text-sm font-medium text-white hover:opacity-90"
        >
          เพิ่มผู้ใช้
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div
            key={user.email}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-navy">{user.name}</p>
              <p className="text-sm text-navy/60">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-soft px-2.5 py-1 text-xs font-medium text-blue">
                {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครู'}
              </span>
              {confirmDeleteEmail === user.email ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    className="h-9 rounded-[var(--radius-control)] bg-danger px-3 text-sm font-medium text-white"
                  >
                    ยืนยันลบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteEmail(null)}
                    className="h-9 rounded-[var(--radius-control)] border border-line px-3 text-sm text-navy"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteEmail(user.email)}
                  className="h-9 rounded-[var(--radius-control)] border border-line px-3 text-sm text-navy hover:bg-blue-soft"
                >
                  ลบสิทธิ์
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-sm text-navy/50">ยังไม่มีผู้ใช้งาน</p>}
      </div>
    </div>
  )
}
