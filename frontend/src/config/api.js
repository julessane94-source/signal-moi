// Central API base URL for frontend
// Prefer NEXT_PUBLIC_API_URL set in Vercel; fallback to localhost for dev
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
export default API_BASE