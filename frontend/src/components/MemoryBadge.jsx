function lastActiveText(lastActiveAt) {
  if (!lastActiveAt) return 'recently'
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export default function MemoryBadge({ context, onDismiss }) {
  if (!context?.hasHistory) return null

  return (
    <div className="memory-banner">
      <div className="memory-copy">
        <div className="memory-label"><span aria-hidden="true">🧠</span> HydraDB recalls your journey</div>
        <div>{context.message}</div>
      </div>

      <div className="pill-row">
        {(context.urgentItems ?? []).slice(0, 2).map((item, index) => (
          <span className="urgent-pill" key={`${item.name}-${index}`}>
            {item.type === 'hackathon' ? `${item.name} · ${item.daysLeft} days` : `${item.name} hiring`}
          </span>
        ))}
      </div>

      <button className="panel-close" type="button" onClick={onDismiss} aria-label="Dismiss memory banner">×</button>

      <div className="memory-foot">
        <span>Last active {lastActiveText(context.lastActiveAt)}</span>
        <span className="pulse-dot" />
        <span style={{ color: 'var(--success)' }}>Memory active</span>
      </div>
    </div>
  )
}
