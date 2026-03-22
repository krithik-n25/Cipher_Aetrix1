export default function FacilityCard({ facility, triageLevel, showMap = true }) {
  if (!facility) return null

  const borderColor = triageLevel === 'RED' ? '#EF4444' : triageLevel === 'YELLOW' ? '#F59E0B' : 'var(--teal)'
  // Opens Google Maps navigation from user's current location to the facility
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}&travelmode=driving`
  const embedUrl = `https://maps.google.com/maps?q=${facility.lat},${facility.lng}&z=15&output=embed`

  const distLabel = facility.distance != null
    ? facility.distance < 1
      ? `${Math.round(facility.distance * 1000)} m away`
      : `${facility.distance.toFixed(1)} km away`
    : null

  return (
    <div className="card" style={{ borderLeft: `4px solid ${borderColor}`, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>🏥</span>
          <span style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>Nearest Facility</span>
        </div>
        {distLabel && (
          <span className="badge badge-blue">{distLabel}</span>
        )}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{facility.name}</div>
      <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>{facility.type}</div>

      {facility.open24h
        ? <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500, marginBottom: 8 }}>🟢 Open 24 hours</div>
        : facility.hours
          ? <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 8 }}>⏰ {facility.hours}</div>
          : null
      }

      {showMap && facility.lat && facility.lng && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, height: 180 }}>
          <iframe
            src={embedUrl}
            width="100%" height="180"
            style={{ border: 0 }}
            loading="lazy"
            title={`Map for ${facility.name}`}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {facility.phone && (
          <a href={`tel:${facility.phone}`} className="btn-secondary" style={{ flex: 1, padding: '10px 16px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}>
            📞 Call
          </a>
        )}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ flex: 1, padding: '10px 16px', fontSize: 13, textAlign: 'center', textDecoration: 'none' }}
        >
          🗺️ Directions
        </a>
      </div>
    </div>
  )
}
