const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  return safeParse(window.localStorage.getItem(key), fallback)
}

export const isQuotaExceededError = (error) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014)

export const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return true

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    if (isQuotaExceededError(error)) return false
    throw error
  }
}

export const removeStorage = (key) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}
