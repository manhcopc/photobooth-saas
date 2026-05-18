import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell, UserShell } from './components/common/AppShell'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute'
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
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { useUploadQueue } from './hooks/useUploadQueue'

function App() {
  useUploadQueue()

  return (
    <Routes>
      <Route element={<UserShell />}>
        <Route index element={<LandingPage />} />
        <Route path="e/:slug" element={<BoothStartPage />} />
        <Route path="e/:slug/capture" element={<CapturePage />} />
        <Route path="e/:slug/select" element={<SelectPhotosPage />} />
        <Route path="e/:slug/preview" element={<PreviewPage />} />
        <Route path="e/:slug/success" element={<SuccessPage />} />
      </Route>
      <Route element={<AdminShell />}>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="events" element={<EventsListPage />} />
            <Route path="events/new" element={<CreateEventPage />} />
            <Route path="events/:slug" element={<EventDetailPage />} />
            <Route path="events/:slug/gallery" element={<EventGalleryPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
