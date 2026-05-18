const DEFAULT_DB_NAME = 'photobooth-saas'
const DEFAULT_STORE_NAME = 'keyvaluepairs'

let dbName = DEFAULT_DB_NAME
let storeName = DEFAULT_STORE_NAME
let dbPromise

const openDatabase = () => {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName, 1)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

const runTransaction = async (mode, callback) => {
  const database = await openDatabase()
  if (!database) return undefined

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.onerror = () => reject(transaction.error)
  })
}

const localforage = {
  config({ name, storeName: nextStoreName } = {}) {
    dbName = name || dbName
    storeName = nextStoreName || storeName
  },
  async getItem(key) {
    return runTransaction('readonly', (store) => store.get(key))
  },
  async setItem(key, value) {
    await runTransaction('readwrite', (store) => store.put(value, key))
    return value
  },
  async removeItem(key) {
    await runTransaction('readwrite', (store) => store.delete(key))
  },
}

export default localforage
