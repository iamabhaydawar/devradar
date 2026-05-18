import { useTheme } from '../hooks/useTheme.js'

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ padding: '8px 12px 10px', borderTop: '1px solid var(--border)' }}>
      <div style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: 'var(--text-faint)',
        marginBottom: '7px',
        fontWeight: 600,
      }}>
        Theme
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {Object.values(themes).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '6px 9px',
              borderRadius: '7px',
              width: '100%',
              cursor: 'pointer',
              transition: 'all 120ms',
              background: theme === t.id ? 'var(--accent-bg)' : 'transparent',
              border: `1px solid ${theme === t.id ? 'var(--accent-border)' : 'transparent'}`,
              color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            {/* Preview dots */}
            <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
              {t.preview.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500, flex: 1 }}>
              {t.label}
            </span>
            {theme === t.id && (
              <span style={{ fontSize: '11px', color: 'var(--accent)', flexShrink: 0 }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
