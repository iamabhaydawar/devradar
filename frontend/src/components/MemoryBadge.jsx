const TEAL = '#00C4B4'

export default function MemoryBadge({ message, urgentItems = [], userId }) {
  // Compact inline badge (no message) — used in header
  if (!message) {
    if (!userId) return null
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        backgroundColor: `${TEAL}10`, border: `1px solid ${TEAL}35`,
        borderRadius: '8px', padding: '5px 12px', fontSize: '11px',
        fontFamily: 'monospace', color: TEAL,
      }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: '6px', height: '6px' }}>
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: TEAL,
            opacity: 0.5, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <span style={{ position: 'relative', width: '6px', height: '6px',
                         borderRadius: '50%', backgroundColor: TEAL, display: 'inline-block' }} />
        </span>
        HydraDB · Memory active
      </div>
    )
  }

  // Full banner — returning user with history
  return (
    <div style={{
      backgroundColor: `${TEAL}0d`,
      borderBottom: `1px solid ${TEAL}30`,
      padding: '12px 20px',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto',
                    display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
                    gap: '12px' }}>

        {/* Icon + message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '240px' }}>
          <span style={{ position: 'relative', display: 'inline-flex',
                         width: '8px', height: '8px', marginTop: '5px', flexShrink: 0 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: TEAL,
              opacity: 0.5, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <span style={{ position: 'relative', width: '8px', height: '8px',
                           borderRadius: '50%', backgroundColor: TEAL, display: 'inline-block' }} />
          </span>
          <p style={{ color: TEAL, fontSize: '13px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {/* Urgent items */}
        {urgentItems?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {urgentItems.map((item, i) => (
              <span key={i} style={{
                backgroundColor: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '6px', padding: '3px 10px',
                fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24',
              }}>
                {item.type === 'hackathon'
                  ? `⏰ ${item.name} — ${item.daysLeft}d left`
                  : `📌 ${item.name} still hiring`}
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
