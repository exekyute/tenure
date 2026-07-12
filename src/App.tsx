import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { PlatformProvider, usePlatform } from './state/platform'
import VolunteerHome from './routes/volunteer/VolunteerHome'
import Discover from './routes/volunteer/Discover'
import OpportunityDetail from './routes/volunteer/OpportunityDetail'
import CheckIn from './routes/volunteer/CheckIn'
import Passport from './routes/volunteer/Passport'
import Credits from './routes/volunteer/Credits'
import OrgDashboard from './routes/org/OrgDashboard'
import Roster from './routes/org/Roster'
import ShiftBuilder from './routes/org/ShiftBuilder'
import SignoffQueue from './routes/org/SignoffQueue'
import Reports from './routes/org/Reports'
import MentorWorkspace from './routes/mentor/MentorWorkspace'

function RoleRedirect() {
  const { role } = usePlatform()
  return <Navigate to={`/${role}`} replace />
}

export default function App() {
  return (
    <PlatformProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/volunteer" element={<VolunteerHome />} />
            <Route path="/volunteer/discover" element={<Discover />} />
            <Route path="/volunteer/opportunity/:id" element={<OpportunityDetail />} />
            <Route path="/volunteer/checkin/:regId" element={<CheckIn />} />
            <Route path="/volunteer/passport" element={<Passport />} />
            <Route path="/volunteer/credits" element={<Credits />} />

            <Route path="/org" element={<OrgDashboard />} />
            <Route path="/org/roster" element={<Roster />} />
            <Route path="/org/shifts" element={<ShiftBuilder />} />
            <Route path="/org/signoff" element={<SignoffQueue />} />
            <Route path="/org/reports" element={<Reports />} />

            <Route path="/mentor" element={<MentorWorkspace />} />

            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </Shell>
      </HashRouter>
    </PlatformProvider>
  )
}
