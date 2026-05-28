import { useEffect, useState } from 'react'
import { AUTH_CHANGED_EVENT, getCurrentAdmin, signInAdmin, signOutAdmin } from '../services/authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const currentUser = await getCurrentAdmin()
      if (!mounted) return
      setUser(currentUser)
      setLoading(false)
    }

    loadUser()
    window.addEventListener(AUTH_CHANGED_EVENT, loadUser)

    return () => {
      mounted = false
      window.removeEventListener(AUTH_CHANGED_EVENT, loadUser)
    }
  }, [])

  const signIn = async (credentials) => {
    const session = await signInAdmin(credentials)
    setUser(session.user)
    return session
  }

  const signOut = async () => {
    await signOutAdmin()
    setUser(null)
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signOut,
  }
}
