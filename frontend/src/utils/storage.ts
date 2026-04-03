export function getStorageBase(): string {
  const explicit = import.meta.env.VITE_STORAGE_URL?.replace(/\/+$/, '')
  if (explicit) return explicit

  const api = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || ''
  if (api.endsWith('/api')) {
    // cPanel layout in this project: Laravel lives in /api, public files in /api/public/storage
    return `${api}/public/storage`
  }

  if (api) {
    return `${api}/storage`
  }

  // Same-origin fallback when VITE_API_URL was omitted at build (use with reverse proxy /api)
  return '/api/public/storage'
}

