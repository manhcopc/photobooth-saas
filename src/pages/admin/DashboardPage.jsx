import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/admin/EventCard'
import { StatCard } from '../../components/admin/StatCard'
import { getDashboardAnalytics } from '../../services/analyticsService'

export function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const data = await getDashboardAnalytics()
        if (!mounted) return
        setAnalytics(data)
        setError('')
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Không thể tải dashboard.')
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  const recentEvents = analytics?.recentEvents || []
  const topEvent = analytics?.topEvent

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard helper="Supabase events" label="Tổng events" value={analytics?.totalEvents ?? 0} />
        <StatCard helper="Đang active" label="Event active" value={analytics?.totalActiveEvents ?? 0} />
        <StatCard helper="Ảnh final cloud" label="Tổng ảnh final" value={analytics?.totalFinalImages ?? 0} />
        <StatCard helper="download_count" label="Tổng lượt tải" value={analytics?.totalDownloads ?? 0} />
      </section>
      <section className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-700 p-6 text-white shadow-lg shadow-purple-100">
        <h1 className="text-3xl font-black">Quản lý photobooth web app</h1>
        <p className="mt-2 max-w-2xl text-white/80">Tạo event, upload frame, chia sẻ QR code và xem gallery cloud-first.</p>
        <Link className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-purple-700" to="/admin/events/new">Tạo event mới</Link>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-black">Events gần đây</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentEvents.slice(0, 3).map((event) => <EventCard event={event} imageCount={topEvent?.id === event.id ? topEvent.outputCount : 0} key={event.id} />)}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-xl font-black text-slate-900">Event có nhiều ảnh nhất</h3>
          {topEvent ? (
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-black text-purple-700">{topEvent.name}</p>
              <p className="text-sm font-semibold text-slate-600">/{topEvent.slug} · {topEvent.outputCount} ảnh · {topEvent.downloadCount} lượt tải</p>
            </div>
          ) : <p className="mt-3 text-sm font-semibold text-slate-500">Chưa có dữ liệu ảnh.</p>}
        </article>
      </section>
    </div>
  )
}
