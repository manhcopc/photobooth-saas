import { Link } from 'react-router-dom'

const baseClass = 'inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
const variants = {
  primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-200 hover:shadow-xl',
  secondary: 'bg-white text-purple-700 ring-1 ring-purple-100 hover:bg-purple-50',
  ghost: 'text-purple-700 hover:bg-purple-50',
}

export function Button({ children, className = '', variant = 'primary', to, ...props }) {
  const classes = `${baseClass} ${variants[variant]} ${className}`
  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  )
}
