import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths for leaflet in Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

function ClickableMarker({ lat, lng, setLat, setLng }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat)
      setLng(e.latlng.lng)
    }
  })
  if (!lat || !lng) return null
  return (
    <Marker position={[lat, lng]}>
      <Popup>Position sélectionnée</Popup>
    </Marker>
  )
}

export default function LeafletMap({ lat, lng, setLat, setLng, zoom = 13 }) {
  const center = lat && lng ? [lat, lng] : [46.2276, 2.2137] // France center fallback

  return (
    <div className="w-full h-80 rounded overflow-hidden">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickableMarker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
      </MapContainer>
    </div>
  )
}
