import { Check, Copy, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'

const copyWithFallback = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(input)
  return copied
}

const downloadCanvas = (canvas, fileName) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function QRCodeCard({ event, eventUrl }) {
  const qrCanvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const success = await copyWithFallback(eventUrl).catch(() => false)
    setCopied(success)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const downloadQr = () => {
    const qrCanvas = qrCanvasRef.current
    if (!qrCanvas) return

    const output = document.createElement('canvas')
    output.width = 1200
    output.height = 1400
    const context = output.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, output.width, output.height)
    context.fillStyle = '#0f172a'
    context.textAlign = 'center'
    context.font = '800 54px Arial, sans-serif'
    context.fillText(event.name, output.width / 2, 110)
    context.drawImage(qrCanvas, 88, 160, 1024, 1024)
    context.font = '700 42px Arial, sans-serif'
    context.fillText('Quét để chụp ảnh', output.width / 2, 1260)
    context.font = '500 28px Arial, sans-serif'
    context.fillStyle = '#6b21a8'
    context.fillText(`/e/${event.slug}`, output.width / 2, 1315)
    downloadCanvas(output, `qr-${event.slug}.png`)
    output.width = 0
    output.height = 0
  }

  return (
    <aside className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
      <h2 className="text-2xl font-black text-slate-950">QR Event Page</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">In mã QR này và đặt tại bàn photobooth để khách quét và chụp ảnh.</p>
      <div className="mt-5 inline-block rounded-3xl bg-white p-4 shadow-inner ring-1 ring-purple-100">
        <QRCodeCanvas includeMargin ref={qrCanvasRef} size={280} value={eventUrl} />
      </div>
      <p className="mt-4 break-all rounded-2xl bg-purple-50 p-3 text-sm font-semibold text-purple-700">{eventUrl}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-bold text-white" onClick={copyLink} type="button">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Đã copy link' : 'Copy link'}
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700" onClick={downloadQr} type="button">
          <Download size={16} /> Tải QR PNG
        </button>
      </div>
    </aside>
  )
}
