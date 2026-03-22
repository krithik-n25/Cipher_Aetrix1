/**
 * Fetches real nearby health facilities using OpenStreetMap Overpass API.
 * No API key required. Works anywhere in India.
 *
 * Rules:
 *  - Govt hospitals (PHC, CHC, Govt Hospital): within 5 km, max 3
 *  - Private hospitals: within 3 km, max 2
 *  - Total shown: max 5, sorted by distance
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function classifyFacility(tags) {
  const name = (tags.name || tags['name:en'] || '').toLowerCase()
  const amenity = (tags.amenity || '').toLowerCase()
  const operator = (tags.operator || '').toLowerCase()
  const operatorType = (tags['operator:type'] || '').toLowerCase()
  const healthcare = (tags.healthcare || '').toLowerCase()

  // Detect government
  const isGovt =
    operatorType === 'government' ||
    operatorType === 'public' ||
    operator.includes('govt') ||
    operator.includes('government') ||
    operator.includes('municipal') ||
    operator.includes('amc') ||
    operator.includes('nmc') ||
    operator.includes('bmc') ||
    name.includes('govt') ||
    name.includes('government') ||
    name.includes('civil hospital') ||
    name.includes('district hospital') ||
    name.includes('taluka hospital') ||
    name.includes('phc') ||
    name.includes('primary health') ||
    name.includes('chc') ||
    name.includes('community health') ||
    name.includes('sub centre') ||
    name.includes('sub-centre') ||
    name.includes('urban health') ||
    name.includes('municipal')

  // Facility type label
  let type = 'Hospital'
  if (name.includes('phc') || name.includes('primary health')) type = 'PHC'
  else if (name.includes('chc') || name.includes('community health')) type = 'CHC'
  else if (name.includes('sub centre') || name.includes('sub-centre')) type = 'Sub-Centre'
  else if (name.includes('urban health')) type = 'Urban Health Centre'
  else if (amenity === 'clinic' || healthcare === 'clinic') type = 'Clinic'
  else if (amenity === 'doctors') type = 'Doctor'
  else if (amenity === 'hospital') type = isGovt ? 'Govt Hospital' : 'Private Hospital'

  return { type, isGovt }
}

export async function fetchNearbyFacilities(lat, lng) {
  // Search 5 km — we'll filter by category after
  const radiusM = 5000
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusM},${lat},${lng});
      way["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusM},${lat},${lng});
      node["healthcare"~"^(hospital|clinic|doctor|centre|center)$"](around:${radiusM},${lat},${lng});
      way["healthcare"~"^(hospital|clinic|doctor|centre|center)$"](around:${radiusM},${lat},${lng});
    );
    out center tags;
  `

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error('Overpass API error')
  const data = await res.json()

  // Parse all elements
  const seen = new Set()
  const all = (data.elements || [])
    .map(el => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) return null
      const tags = el.tags || {}
      const rawName = tags.name || tags['name:en'] || ''
      if (!rawName) return null // skip unnamed facilities

      // Deduplicate by name+coords
      const key = rawName.toLowerCase().trim()
      if (seen.has(key)) return null
      seen.add(key)

      const { type, isGovt } = classifyFacility(tags)
      const distance = haversine(lat, lng, elLat, elLng)

      return {
        name: rawName,
        type,
        isGovt,
        lat: elLat,
        lng: elLng,
        phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
        hours: tags.opening_hours || null,
        open24h: tags.opening_hours === '24/7',
        distance,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)

  // Apply smart limits:
  // Govt (PHC/CHC/Govt Hospital): within 5 km, max 3
  // Private: within 3 km, max 2
  const govt = all.filter(f => f.isGovt && f.distance <= 5).slice(0, 3)
  const priv = all.filter(f => !f.isGovt && f.distance <= 3).slice(0, 2)

  // Merge and re-sort by distance, max 5 total
  const merged = [...govt, ...priv]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)

  // If nothing found in strict limits, fall back to nearest 3 of anything
  if (merged.length === 0) {
    return all.slice(0, 3)
  }

  return merged
}
