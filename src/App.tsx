import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import MainLayout from './layout/MainLayout'
import PlansPage from './pages/PlansPage'
import StudentCheckPage from './pages/StudentCheckPage'

// Code-split everything teachers/admins use so the public, mobile-first student pages
// (/ and /plans) don't ship Firestore admin logic, xlsx, or the dashboard in their bundle.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const StaffPage = lazy(() => import('./pages/StaffPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function RouteFallback() {
  return <div className="flex flex-1 items-center justify-center py-16 text-navy/60">กำลังโหลด...</div>
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<StudentCheckPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
