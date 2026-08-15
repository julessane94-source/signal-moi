const firstPresent = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || ''

// Nominatim may return different address keys depending on country and map data.
// Keep only the two labels useful to responders instead of its long display_name.
export const formatPlaceLabel = (address = {}) => {
  const quartier = firstPresent(address.neighbourhood, address.suburb, address.quarter, address.city_district, address.district, address.hamlet)
  const ville = firstPresent(address.city, address.town, address.village, address.municipality, address.county, address.state)

  if (quartier && ville && quartier.toLowerCase() !== ville.toLowerCase()) {
    return `Quartier : ${quartier} · Ville : ${ville}`
  }
  if (quartier || ville) return `Localité : ${quartier || ville}`
  return ''
}

export const reverseGeocodePlace = async (latitude, longitude) => {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
  )
  if (!response.ok) return ''

  const data = await response.json()
  return formatPlaceLabel(data.address) || data.display_name || ''
}
