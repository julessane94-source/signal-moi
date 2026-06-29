// Central API base URL for frontend
// Prefer NEXT_PUBLIC_API_URL set in Vercel; fallback safely based on environment.
const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000'
    return 'https://signal-moi-api.onrender.com'
  }
  return 'http://localhost:5000'
}

export const API_BASE = getApiBase()
export default API_BASE
