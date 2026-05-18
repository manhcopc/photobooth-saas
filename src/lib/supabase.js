export const SUPABASE_FINAL_IMAGES_BUCKET = 'photobooth-final-images'
export const FINAL_OUTPUTS_TABLE = 'final_outputs'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const assertSupabaseConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY để upload ảnh lên Supabase.')
  }
}

const buildHeaders = (extraHeaders = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  ...extraHeaders,
})

const parseResponse = async (response) => {
  const text = await response.text()
  let payload

  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text ? { message: text } : null
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error_description || payload?.error || 'Supabase request failed.'
    throw new Error(message)
  }

  return payload
}

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = {
  storage: {
    from(bucketName) {
      return {
        async upload(path, fileBody, options = {}) {
          assertSupabaseConfig()
          const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${path}`, {
            method: 'POST',
            headers: buildHeaders({
              'Content-Type': options.contentType || fileBody.type || 'application/octet-stream',
              'x-upsert': options.upsert ? 'true' : 'false',
            }),
            body: fileBody,
          })
          const data = await parseResponse(response)
          return { data, error: null }
        },
        getPublicUrl(path) {
          const encodedPath = path.split('/').map(encodeURIComponent).join('/')
          return {
            data: {
              publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${encodedPath}`,
            },
          }
        },
      }
    },
  },
  from(tableName) {
    return {
      async insert(payload) {
        assertSupabaseConfig()
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: buildHeaders({
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          }),
          body: JSON.stringify(payload),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async upsert(payload) {
        assertSupabaseConfig()
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?on_conflict=id`, {
          method: 'POST',
          headers: buildHeaders({
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          }),
          body: JSON.stringify(payload),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async selectByEventId(eventId) {
        assertSupabaseConfig()
        const query = new URLSearchParams({
          select: '*',
          event_id: `eq.${eventId}`,
          order: 'created_at.desc',
        })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          headers: buildHeaders(),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async selectAll() {
        assertSupabaseConfig()
        const query = new URLSearchParams({
          select: '*',
          order: 'created_at.desc',
        })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          headers: buildHeaders(),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
    }
  },
}
