const trimSlashes = (value) => String(value || '').replace(/\/+$/, '')

export const getPublicEventUrl = (slug) => {
  const configuredUrl = trimSlashes(import.meta.env.VITE_PUBLIC_APP_URL)
  const origin = configuredUrl || (typeof window !== 'undefined' ? trimSlashes(window.location.origin) : '')
  return `${origin}/e/${slug}`
}
