import { useEffect, useState } from 'react'
import { Phone } from '@heroicons/react/24/outline'
import { API_BASE } from '../../config/api'

export default function EmergencyButtons() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    let mounted = true
    fetch(`${API_BASE}/api/auth/site-config`)
      .then(res => res.json())
      .then(data => {
        if (mounted) setConfig(data)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (!config) return null
  const police = config.emergencyPolice || config.emergency_police || null
  const fire = config.emergencyFire || config.emergency_fire || null
  if (!police && !fire) return null

  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col items-end gap-3">
      {police && (
        <a href={`tel:${police.replace(/\s+/g,'')}`} className="flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
          <Phone className="h-5 w-5" />
          <span className="font-semibold">Police</span>
        </a>
      )}
      {fire && (
        <a href={`tel:${fire.replace(/\s+/g,'')}`} className="flex items-center gap-3 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
          <Phone className="h-5 w-5" />
          <span className="font-semibold">Sapeurs‑pompiers</span>
        </a>
      )}
    </div>
  )
}
