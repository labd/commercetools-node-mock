export type Location = {
  latitude: number
  longitude: number
}

/**
 * Returns the distance between src and dst as meters
 */
export const haversineDistance = (src: Location, dst: Location) => {
  const RADIUS_OF_EARTH_IN_KM = 6371
  const toRadian = (deg: number) => deg * (Math.PI / 180)

  const dLat = toRadian(dst.latitude - src.latitude)
  const dLon = toRadian(dst.longitude - src.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(src.latitude)) *
      Math.cos(toRadian(dst.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return RADIUS_OF_EARTH_IN_KM * c * 1000
}
