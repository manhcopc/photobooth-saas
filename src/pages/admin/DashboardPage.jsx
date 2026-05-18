import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../../components/admin/EventCard'
import { StatCard } from '../../components/admin/StatCard'
import { getFinalImages } from '../../store/booth'
import { getEvents } from '../../store/events'

export function DashboardPage() {
  const events = getEvents()
  const images = getFinalImages()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard helper="Mock/localStorage" label="Tổng events" value={events.length} />
        <StatCard helper="Ảnh final đã tạo" label="Gallery" value={images.length} />
        <StatCard helper="Không cần backend" label="Trạng thái" value="MVP" />
      </section>
      <section className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-700 p-6 text-white shadow-lg shadow-purple-100">
        <h1 className="text-3xl font-black">Quản lý photobooth web app</h1>
        <p className="mt-2 max-w-2xl text-white/80">Tạo event, chia sẻ QR code và xem lại ảnh final ngay trong trình duyệt bằng localStorage.</p>
        <Link className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-purple-700" to="/admin/events/new">Tạo event mới</Link>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-black">Events gần đây</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.slice(0, 3).map((event) => <EventCard event={event} imageCount={getFinalImages(event.slug).length} key={event.id} />)}
        </div>
      </section>
    </div>
  )
}
