import { getEnv, isSupabaseEnvConfigured, validateEnv } from '../utils/env'

export const SUPABASE_FINAL_IMAGES_BUCKET = 'photobooth-final-images'
export const FINAL_OUTPUTS_TABLE = 'final_outputs'
export const SUPABASE_FRAMES_BUCKET = 'photobooth-frames'

const { supabaseUrl, supabaseAnonKey } = getEnv()
let authToken = ''

validateEnv()

const assertSupabaseConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY để upload ảnh lên Supabase.')
  }
}

const buildHeaders = (extraHeaders = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${authToken || supabaseAnonKey}`,
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

export const isSupabaseConfigured = () => isSupabaseEnvConfigured()

export const setSupabaseAuthToken = (token = '') => {
  authToken = token
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      assertSupabaseConfig()
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, password }),
      })
      const data = await parseResponse(response)
      setSupabaseAuthToken(data.access_token || '')
      return { data, error: null }
    },
    async getUser(accessToken) {
      assertSupabaseConfig()
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: buildHeaders({ Authorization: `Bearer ${accessToken || authToken || supabaseAnonKey}` }),
      })
      const data = await parseResponse(response)
      return { data, error: null }
    },
    async signOut(accessToken) {
      assertSupabaseConfig()
      const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: buildHeaders({ Authorization: `Bearer ${accessToken || authToken || supabaseAnonKey}` }),
      })
      if (response.status !== 204) await parseResponse(response)
      setSupabaseAuthToken('')
      return { data: null, error: null }
    },
  },
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
      async selectById(id, columns = '*') {
        assertSupabaseConfig()
        const query = new URLSearchParams({ select: columns, id: `eq.${id}`, limit: '1' })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          headers: buildHeaders(),
        })
        const data = await parseResponse(response)
        return { data: Array.isArray(data) ? data[0] || null : data, error: null }
      },
      async selectByColumn(column, value, columns = '*') {
        assertSupabaseConfig()
        const query = new URLSearchParams({ select: columns, [column]: `eq.${value}` })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          headers: buildHeaders(),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async updateById(id, payload) {
        assertSupabaseConfig()
        const query = new URLSearchParams({ id: `eq.${id}` })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          method: 'PATCH',
          headers: buildHeaders({
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          }),
          body: JSON.stringify(payload),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async selectByEventId(eventId, columns = '*') {
        assertSupabaseConfig()
        const query = new URLSearchParams({
          select: columns,
          event_id: `eq.${eventId}`,
          order: 'created_at.desc',
        })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          headers: buildHeaders(),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async deleteById(id) {
        assertSupabaseConfig()
        const query = new URLSearchParams({ id: `eq.${id}` })
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${query.toString()}`, {
          method: 'DELETE',
          headers: buildHeaders({ Prefer: 'return=minimal' }),
        })
        const data = await parseResponse(response)
        return { data, error: null }
      },
      async selectAll(columns = '*') {
        assertSupabaseConfig()
        const query = new URLSearchParams({
          select: columns,
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
