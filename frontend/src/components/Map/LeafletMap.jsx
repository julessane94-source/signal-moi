import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Leaflet
const DynamicMapContent = dynamic(
  () => import('./MapContent.jsx'),
  {
    loading: () => <div className="w-full h-80 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
)

export default function LeafletMap({ lat, lng, setLat, setLng, onSelect, zoom = 13 }) {
  return (
    <DynamicMapContent lat={lat} lng={lng} setLat={setLat} setLng={setLng} onSelect={onSelect} zoom={zoom} />
  )
}
