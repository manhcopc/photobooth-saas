const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')

const env = {
  supabaseUrl: trimTrailingSlash(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  publicAppUrl: trimTrailingSlash(import.meta.env.VITE_PUBLIC_APP_URL),
}

const hasWarned = new Set()

const warnMissing = (key, message) => {
  if (hasWarned.has(key) || import.meta.env.PROD) return
  hasWarned.add(key)
  console.warn(`[env] ${message}`)
}

export const getEnv = () => ({ ...env })

export const getPublicAppOrigin = () => {
  if (env.publicAppUrl) return env.publicAppUrl
  if (typeof window !== 'undefined' && window.location?.origin) return trimTrailingSlash(window.location.origin)
  return ''
}

export const validateEnv = () => {
  if (!env.supabaseUrl) warnMissing('VITE_SUPABASE_URL', 'Thiếu VITE_SUPABASE_URL. Các chức năng Supabase có thể không hoạt động.')
  if (!env.supabaseAnonKey) warnMissing('VITE_SUPABASE_ANON_KEY', 'Thiếu VITE_SUPABASE_ANON_KEY. Các chức năng Supabase có thể không hoạt động.')
  if (!env.publicAppUrl) {
    warnMissing('VITE_PUBLIC_APP_URL', 'Thiếu VITE_PUBLIC_APP_URL. App sẽ fallback sang window.location.origin để tạo link sự kiện.')
  }
}

export const isSupabaseEnvConfigured = () => Boolean(env.supabaseUrl && env.supabaseAnonKey)

