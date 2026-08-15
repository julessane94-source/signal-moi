import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as Location from 'expo-location'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [position, setPosition] = useState(null)
  const [address, setAddress] = useState(null)
  const [permission, setPermission] = useState(null)
  const [loading, setLoading] = useState(false)

  async function requestCurrentLocation() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setPermission(status)
      if (status !== 'granted') {
        return null
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      })
      const coords = current.coords
      setPosition(coords)

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        setAddress(places?.[0] || null)
      } catch (error) {
        setAddress(null)
      }

      return coords
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    requestCurrentLocation()
  }, [])

  const value = useMemo(
    () => ({
      position,
      address,
      permission,
      loading,
      requestCurrentLocation
    }),
    [position, address, permission, loading]
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used inside LocationProvider')
  }
  return context
}
