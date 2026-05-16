export default function MemoryBadge({ userId, sessionCount, isReturning }) {
  if (!userId) return null

  return (
    <div
      title={`HydraDB user ID: ${userId}`}
      className="flex items-center gap-2 bg-surface-700/80 border border-white/10
                 rounded-lg px-3 py-1.5 text-xs"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full
                         bg-emerald-400 opacity-50" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="text-white/60 font-mono">
        {isReturning
          ? `Session ${sessionCount} · HydraDB`
          : 'Memory active · HydraDB'}
      </span>
    </div>
  )
}
