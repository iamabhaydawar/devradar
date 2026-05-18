/**
 * DevRadar SVG logo mark — radar graph concept.
 * Center pulse + 3 satellite nodes + dashed outer ring.
 */
export default function DevRadarLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="devradar logo"
    >
      {/* Outer dashed ring */}
      <circle cx="20" cy="20" r="18" stroke="#d4f53c" strokeWidth="1.5" strokeDasharray="3 2.5" opacity="0.55" />
      {/* Inner ring */}
      <circle cx="20" cy="20" r="10" stroke="#d4f53c" strokeWidth="1" opacity="0.20" />
      {/* Center dot */}
      <circle cx="20" cy="20" r="4" fill="#d4f53c" />

      {/* Satellite — top (skill / lime) */}
      <circle cx="20" cy="5"  r="2.5" fill="#d4f53c" opacity="0.85" />
      {/* Satellite — bottom-right (startup / amber) */}
      <circle cx="33" cy="27" r="2.5" fill="#ea9d34" opacity="0.85" />
      {/* Satellite — bottom-left (gap / err) */}
      <circle cx="7"  cy="27" r="2.5" fill="#e08080" opacity="0.85" />

      {/* Connection lines */}
      <line x1="20" y1="20" x2="20" y2="7.5"  stroke="#d4f53c" strokeWidth="1" opacity="0.35" strokeDasharray="2 1.5" />
      <line x1="20" y1="20" x2="31" y2="26"   stroke="#ea9d34" strokeWidth="1" opacity="0.35" strokeDasharray="2 1.5" />
      <line x1="20" y1="20" x2="9"  y2="26"   stroke="#e08080" strokeWidth="1" opacity="0.35" strokeDasharray="2 1.5" />
    </svg>
  )
}
