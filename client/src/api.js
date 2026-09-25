const configured = import.meta.env.VITE_API_URL?.trim()
if (import.meta.env.PROD && !configured) {
  throw new Error('VITE_API_URL must be configured before building the frontend')
}
export const API_URL = (configured || 'http://127.0.0.1:5000').replace(/\/+$/, '')
