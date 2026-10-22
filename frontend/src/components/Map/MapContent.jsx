import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icons
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
  })
}

function ClickableMarker({ lat, lng, setLat, setLng, onSelect }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat)
      setLng(e.latlng.lng)
      onSelect?.(e.latlng.lat, e.latlng.lng)
    }
  })
  if (lat == null || lng == null) return null
  return (
    <Marker position={[lat, lng]}>
      <Popup>Position sélectionnée</Popup>
    </Marker>
  )
}

export default function MapContent({ lat, lng, setLat, setLng, onSelect, zoom = 13 }) {
  const hasPoint = lat != null && lng != null
  const center = hasPoint ? [lat, lng] : [12.7086, -15.5569]

  return (
    <div className="w-full h-80 rounded overflow-hidden">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickableMarker lat={lat} lng={lng} setLat={setLat} setLng={setLng} onSelect={onSelect} />
      </MapContainer>
    </div>
  )
}
