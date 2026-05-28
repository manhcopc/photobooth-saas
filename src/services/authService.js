import { setSupabaseAuthToken, supabase } from '../lib/supabase'
import { STORAGE_KEYS } from '../store/keys'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'

export const AUTH_CHANGED_EVENT = 'photobooth-auth-changed'

const notifyAuthChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

const normalizeSession = (data) => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  expiresAt: data.expires_at,
  user: data.user,
})

export const getStoredSession = async () => {
  const session = await readStorage(STORAGE_KEYS.adminAuthSession, null)
  if (session?.accessToken) setSupabaseAuthToken(session.accessToken)
  return session
}

export const signInAdmin = async ({ email, password }) => {
  const { data } = await supabase.auth.signInWithPassword({ email, password })
  const session = normalizeSession(data)
  await writeStorage(STORAGE_KEYS.adminAuthSession, session)
  notifyAuthChanged()
  return session
}

export const signOutAdmin = async () => {
  const session = await getStoredSession()
  await supabase.auth.signOut(session?.accessToken).catch(() => null)
  await removeStorage(STORAGE_KEYS.adminAuthSession)
  setSupabaseAuthToken('')
  notifyAuthChanged()
}

export const getCurrentAdmin = async () => {
  const session = await getStoredSession()
  if (!session?.accessToken) return null
  try {
    const { data } = await supabase.auth.getUser(session.accessToken)
    return data?.user || session.user || null
  } catch {
    await removeStorage(STORAGE_KEYS.adminAuthSession)
    setSupabaseAuthToken('')
    notifyAuthChanged()
    return null
  }
}
