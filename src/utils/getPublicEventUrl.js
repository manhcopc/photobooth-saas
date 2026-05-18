import { getPublicAppOrigin } from './env'

export const getPublicEventUrl = (slug) => {
  if (!slug) return ''
  const origin = getPublicAppOrigin()
  const encodedSlug = encodeURIComponent(String(slug).trim())

  if (!origin) {
    return `/e/${encodedSlug}`
  }

  return `${origin}/e/${encodedSlug}`
}
