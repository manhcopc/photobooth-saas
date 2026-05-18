import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell, UserShell } from './components/common/AppShell'
import { AdminLayout } from './components/admin/AdminLayout'
import { LandingPage } from './pages/user/LandingPage'
import { BoothStartPage } from './pages/user/BoothStartPage'
import { CapturePage } from './pages/user/CapturePage'
import { SelectPhotosPage } from './pages/user/SelectPhotosPage'
import { PreviewPage } from './pages/user/PreviewPage'
import { SuccessPage } from './pages/user/SuccessPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EventsListPage } from './pages/admin/EventsListPage'
import { CreateEventPage } from './pages/admin/CreateEventPage'
import { EventDetailPage } from './pages/admin/EventDetailPage'
import { EventGalleryPage } from './pages/admin/EventGalleryPage'

function App() {
  return (
    <Routes>
      <Route element={<UserShell />}>
        <Route index element={<LandingPage />} />
        <Route path="booth/:slug" element={<BoothStartPage />} />
        <Route path="booth/:slug/capture" element={<CapturePage />} />
        <Route path="booth/:slug/select" element={<SelectPhotosPage />} />
        <Route path="booth/:slug/preview" element={<PreviewPage />} />
        <Route path="booth/:slug/success" element={<SuccessPage />} />
      </Route>
      <Route element={<AdminShell />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsListPage />} />
          <Route path="events/new" element={<CreateEventPage />} />
          <Route path="events/:slug" element={<EventDetailPage />} />
          <Route path="events/:slug/gallery" element={<EventGalleryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
