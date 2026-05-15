import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthSessionProvider } from '@/components/auth/AuthSessionProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'
import { CivicLiveEvents } from '@/components/live/CivicLiveEvents'
import { PublicActivityPage } from '@/pages/activity/PublicActivityPage'
import { AdminAgentsPage } from '@/pages/admin/AdminAgentsPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminIssuesPage } from '@/pages/admin/AdminIssuesPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CommandCenterPage } from '@/pages/command/CommandCenterPage'
import { IssueDetailsPage } from '@/pages/issues/IssueDetailsPage'
import { LiveMapLandingPage } from '@/pages/LiveMapLandingPage'
import { MissionDetailsPage } from '@/pages/missions/MissionDetailsPage'
import { MissionsPage } from '@/pages/missions/MissionsPage'
import { PartnerDashboardPage } from '@/pages/partner/PartnerDashboardPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { ReportIssuePage } from '@/pages/report/ReportIssuePage'
import { RewardsPage } from '@/pages/rewards/RewardsPage'
import { ZoneDetailsPage } from '@/pages/zones/ZoneDetailsPage'
import { ZoneLeaderboardPage } from '@/pages/zones/ZoneLeaderboardPage'

function App() {
  return (
    <BrowserRouter>
      <AuthSessionProvider>
        <CivicLiveEvents />
        <Routes>
          <Route path="/" element={<LiveMapLandingPage />} />
          <Route path="/activity" element={<PublicActivityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/zones" element={<ZoneLeaderboardPage />} />
          <Route path="/zones/:id" element={<ZoneDetailsPage />} />
          <Route path="/command-center" element={<CommandCenterPage />} />
          <Route path="/issues/:id" element={<IssueDetailsPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/:id" element={<MissionDetailsPage />} />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportIssuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminAgentsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/issues"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminIssuesPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/partner"
            element={
              <RoleProtectedRoute allowedRoles={['partner']}>
                <PartnerDashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthSessionProvider>
    </BrowserRouter>
  )
}

export default App
