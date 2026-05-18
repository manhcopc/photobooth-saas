const trimSlashes = (value) => String(value || '').replace(/\/+$/, '')

export const getPublicEventUrl = (slug) => {
  if (!slug) return ''
  const configuredUrl = trimSlashes(import.meta.env.VITE_PUBLIC_APP_URL)
  const origin = configuredUrl || (typeof window !== 'undefined' ? trimSlashes(window.location.origin) : '')
  const encodedSlug = encodeURIComponent(String(slug).trim())

  if (!origin) {
    return `/e/${encodedSlug}`
  }

  return `${origin}/e/${encodedSlug}`
}
