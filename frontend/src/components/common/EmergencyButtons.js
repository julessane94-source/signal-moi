import { useEffect, useState } from 'react'
import { PhoneIcon as Phone } from '@heroicons/react/24/outline'
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
    <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-3 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-4 sm:gap-3">
      {police && (
        <a href={`tel:${police.replace(/\s+/g,'')}`} className="flex min-h-11 items-center gap-3 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg transition-transform hover:scale-105">
          <Phone className="h-5 w-5" />
          <span className="font-semibold">Police</span>
        </a>
      )}
      {fire && (
        <a href={`tel:${fire.replace(/\s+/g,'')}`} className="flex min-h-11 items-center gap-3 rounded-full bg-red-600 px-4 py-2 text-white shadow-lg transition-transform hover:scale-105">
          <Phone className="h-5 w-5" />
          <span className="font-semibold">Sapeurs‑pompiers</span>
        </a>
      )}
    </div>
  )
}
