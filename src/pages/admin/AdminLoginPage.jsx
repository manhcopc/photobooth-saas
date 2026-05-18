import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, signIn } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const redirectTo = location.state?.from?.pathname || '/admin'

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await signIn(form)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setMessage(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email/password.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && isAuthenticated) return <Navigate replace to={redirectTo} />

  return (
    <div className="grid min-h-svh place-items-center bg-gradient-to-br from-pink-50 to-purple-100 p-5">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl shadow-purple-100">
        <p className="text-sm font-bold uppercase tracking-wide text-pink-500">Booth Admin</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Dùng tài khoản Supabase Auth email/password để quản lý event.</p>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 font-bold text-slate-700">Email<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('email')} required type="email" value={form.email} /></label>
          <label className="grid gap-2 font-bold text-slate-700">Mật khẩu<input className="rounded-2xl border border-slate-200 px-4 py-3 font-medium" onChange={update('password')} required type="password" value={form.password} /></label>
          {message ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{message}</p> : null}
          <Button disabled={submitting} type="submit">{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
        </form>
      </section>
    </div>
  )
}
