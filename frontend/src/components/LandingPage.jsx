import { useEffect, useRef } from 'react'
import { LogoMark, LogoText } from './Logo.jsx'

// ── Small icon canvas (feature cards) ────────────────────────────────────────

const LIME = '#d4f53c'

function drawSmallIcon(canvas, size, angle) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  const c = size / 2, r = size * 0.38
  ctx.fillStyle = LIME
  ctx.beginPath(); ctx.arc(c, c, size * 0.08, 0, Math.PI * 2); ctx.fill()
  const sweep = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  ;[0.38, 0.62, 0.88].forEach(f => {
    const ri = r * f
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const x = c + Math.cos(a) * ri, y = c + Math.sin(a) * ri
      const da = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const trail = (sweep - da + Math.PI * 2) % (Math.PI * 2)
      const bright = trail < 0.15 ? 1 : trail < 1.2 ? 0.8 * (1 - (trail - 0.15) / 1.05) : 0
      ctx.globalAlpha = bright > 0 ? bright : 0.6
      ctx.beginPath(); ctx.arc(x, y, size * 0.055, 0, Math.PI * 2)
      ctx.fillStyle = bright > 0 ? LIME : '#2a2a28'; ctx.fill()
    }
  })
  ctx.globalAlpha = 1
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const mono = { fontFamily: "'Courier New', monospace" }

const pill = (bg, color, border) => ({
  fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  background: bg, color, border: `1px solid ${border}`,
})

const btnFill = {
  ...mono, fontWeight: 700, padding: 'clamp(10px,1.2vw,14px) clamp(22px,2.5vw,36px)',
  borderRadius: 30, background: LIME, color: '#0f0f0f', border: 'none', cursor: 'pointer',
  letterSpacing: '0.02em', transition: 'opacity 0.15s',
  fontSize: 'clamp(12px, 1.1vw, 15px)',
}

const btnGhost = {
  ...mono, fontWeight: 700, padding: 'clamp(10px,1.2vw,14px) clamp(22px,2.5vw,36px)',
  borderRadius: 30, background: 'transparent', color: '#f0f0ee',
  border: '1.5px solid rgba(255,255,255,0.15)', cursor: 'pointer',
  letterSpacing: '0.02em', transition: 'border-color 0.15s',
  fontSize: 'clamp(12px, 1.1vw, 15px)',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage({ onStart, onContinue, isReturning }) {
  const i1Ref = useRef(null)
  const i2Ref = useRef(null)
  const i3Ref = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    let ang = 0, fr = 0
    function loop() {
      ang += 0.016; fr++
      if (fr % 4 === 0) {
        if (i1Ref.current) drawSmallIcon(i1Ref.current, 20, ang)
        if (i2Ref.current) drawSmallIcon(i2Ref.current, 20, ang + 2.1)
        if (i3Ref.current) drawSmallIcon(i3Ref.current, 20, ang + 4.2)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', ...mono, color: '#f0f0ee', overflowX: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{ height: 52, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px, 4vw, 48px)', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" onClick={onStart} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.01em' }}>devradar</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={pill('#1a2200', LIME, 'rgba(212,245,60,.2)')}>● HydraDB</span>
          <button type="button" onClick={onStart} style={{ ...mono, fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 700, padding: '7px 16px', borderRadius: 30, background: LIME, color: '#0f0f0f', border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
            get started →
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: 'clamp(48px,8vw,96px) clamp(20px,4vw,48px) clamp(40px,6vw,72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(24px,3vw,40px)' }}>
            <LogoMark size={Math.min(200, Math.max(140, 200))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(20px,2.5vw,32px)' }}>
            <LogoText size="lg" />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            <span style={pill('#1a2200', LIME, 'rgba(212,245,60,.2)')}>student</span>
            <span style={pill('#1c1c1c', '#555550', 'rgba(255,255,255,0.07)')}>india · 2026</span>
            <span style={pill('#1c1c1c', '#555550', 'rgba(255,255,255,0.07)')}>WikiThon</span>
          </div>

          <p style={{ fontSize: 'clamp(13px, 1.6vw, 18px)', color: '#888880', lineHeight: 1.8, marginBottom: 'clamp(24px,3vw,40px)', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            AI-powered career intelligence for Indian developers.<br />
            Match your stack · Surface hackathons · Identify gaps.<br />
            <strong style={{ color: LIME, fontWeight: 700 }}>Every session remembered by HydraDB.</strong>
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'clamp(28px,4vw,48px)' }}>
            <button
              type="button" onClick={onStart} style={btnFill}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
            >
              {isReturning ? 'start fresh →' : 'analyse my stack →'}
            </button>
            {isReturning && (
              <button
                type="button" onClick={onContinue} style={btnGhost}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)' }}
              >
                my graph →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: LIME }} />
              <span style={{ fontSize: 'clamp(10px, 0.9vw, 12px)', color: '#555550', letterSpacing: '0.06em' }}>devradar.vercel.app</span>
              <span style={{ fontSize: 10, color: '#3a3a3a' }}>·</span>
              <span style={{ fontSize: 'clamp(10px, 0.9vw, 12px)', color: '#3a3a3a', letterSpacing: '0.04em' }}>backend on render</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[{ n: '20+', l: 'startups mapped' }, { n: '15+', l: 'hackathons tracked' }, { n: '30', l: 'skills in taxonomy' }].map((s, i) => (
          <div key={i} style={{ padding: 'clamp(20px,3vw,40px) 20px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: LIME, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 'clamp(9px, 0.8vw, 12px)', color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#555550', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            // <span style={{ color: LIME }}>features</span> //
          </div>
          <div style={{ fontSize: 'clamp(18px, 2.8vw, 32px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12 }}>
            everything you need to<br />land your first startup role.
          </div>
          <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', color: '#555550', maxWidth: 480, lineHeight: 1.8 }}>
            Built in 48 hours for WikiThon. Every feature is real, every dataset is curated, every AI response is context-aware.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(10px,1.2vw,20px)', marginTop: 'clamp(24px,3vw,48px)' }}>
            {[
              { ref: i1Ref, isCanvas: true,  title: '// stack matching //',   body: 'Enter your skills. Get ranked against 20 top Indian startups by stack overlap. Razorpay, Groww, Zepto and more.' },
              { ref: i2Ref, isCanvas: true,  title: '// gap analysis //',      body: 'Claude AI pinpoints your missing skills with salary impact and timelines. TypeScript in 2 weeks → +18%.' },
              { ref: i3Ref, isCanvas: true,  title: '// hackathon radar //',   body: 'Live hackathons scored against your stack. Deadline urgency surfaced on every return visit.' },
              { icon: '✦',                   title: '// HydraDB memory //',    body: 'Persistent cross-session memory. Returns are context-aware — Claude references your history.' },
              { icon: '⬡',                   title: '// interview prep //',    body: "Company-specific questions generated by Claude. Razorpay, Groww, CRED — each startup's real interview patterns." },
              { icon: '◈',                   title: '// fallback mode //',     body: 'If HydraDB is unreachable, an in-memory Map takes over. The demo never crashes.' },
            ].map((f, i) => (
              <FeatCard key={i} title={f.title} body={f.body}>
                {f.isCanvas
                  ? <canvas ref={f.ref} width={20} height={20} style={{ display: 'block' }} />
                  : <span style={{ fontSize: 14, color: LIME }}>{f.icon}</span>
                }
              </FeatCard>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 clamp(20px,4vw,48px)' }} />

      {/* ── Memory ───────────────────────────────────────────────── */}
      <section style={{ background: '#111119', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(40px,5vw,72px) clamp(20px,4vw,48px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', gap: 'clamp(28px,5vw,64px)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#555550', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
              // <span style={{ color: LIME }}>persistent memory</span> //
            </div>
            <div style={{ fontSize: 'clamp(16px, 2.2vw, 28px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 16 }}>
              HydraDB is not a<br />side feature. It is<br />the product.
            </div>
            <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', color: '#555550', lineHeight: 1.85, marginBottom: 20 }}>
              Every startup you view, every gap Claude identifies, every hackathon you bookmark — stored as a living profile. Returns feel like talking to someone who was paying attention.
            </div>
            <div style={{ fontSize: 'clamp(11px, 1vw, 14px)', color: LIME, fontWeight: 700, letterSpacing: '0.04em' }}>→ run node seed-demo.js to see it in action</div>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 9, color: '#555550', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>demo_user_001 · 7-day profile</div>
            <div style={{ background: '#0f0f0f', border: '1px solid rgba(212,245,60,.12)', borderRadius: 14, padding: 'clamp(14px,2vw,22px)' }}>
              {[
                ['day 1', 'viewed Razorpay, Groww'],
                ['day 3', 'gap analysis run → TypeScript, Docker'],
                ['day 5', 'bookmarked ETHIndia 2026'],
                ['day 7', 'return visit triggers memory recall'],
              ].map(([day, text], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 'clamp(10px, 1vw, 13px)', color: '#555550' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: LIME, flexShrink: 0 }} />
                  <span style={{ color: '#888880' }}>{day}</span> · {text}
                </div>
              ))}
              <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px solid rgba(212,245,60,.1)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 12, color: LIME, flexShrink: 0 }}>✦</span>
                <span style={{ color: '#8aaa18', fontSize: 'clamp(10px, 0.9vw, 13px)', lineHeight: 1.7 }}>
                  Welcome back — last visit you explored Razorpay. TypeScript closes 60% of their roles. ETHIndia in 6 days.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech stack ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(36px,5vw,64px) clamp(20px,4vw,48px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#555550', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            // <span style={{ color: LIME }}>tech stack</span> //
          </div>
          <div style={{ fontSize: 'clamp(14px, 1.6vw, 22px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.02em', marginBottom: 6 }}>built with real tools.</div>
          <div style={{ fontSize: 'clamp(11px, 1vw, 13px)', color: '#555550' }}>React 18 · Node.js · Anthropic Claude · HydraDB · Vercel · Render</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {['React 18', 'Tailwind CSS', 'Node.js', 'Express', 'Claude API', 'HydraDB SDK'].map(t => (
              <span key={t} style={{ ...mono, fontSize: 'clamp(11px, 0.9vw, 13px)', fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.03em', background: '#1a2200', color: '#8aaa18', border: '1px solid rgba(212,245,60,.15)' }}>{t}</span>
            ))}
            {['Vite', 'Render', 'Vercel', 'JSON datasets'].map(t => (
              <span key={t} style={{ ...mono, fontSize: 'clamp(11px, 0.9vw, 13px)', fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.03em', background: '#1c1c1c', color: '#3a3a3a', border: '1px solid rgba(255,255,255,0.05)' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(36px,5vw,64px) clamp(20px,4vw,48px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#555550', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            // <span style={{ color: LIME }}>how it works</span> //
          </div>
          <div style={{ fontSize: 'clamp(14px, 1.6vw, 22px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.02em', marginBottom: 'clamp(20px,3vw,36px)' }}>four steps. one screen.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'clamp(10px,1.2vw,20px)' }}>
            {[
              { n: '01', title: 'enter your stack',  body: 'Pick your skills from 30 curated options. React, Python, Go, Docker — whatever you know.' },
              { n: '02', title: 'get matched',        body: 'Claude deep-analyses your top 5 startup matches. Real tech stacks, real salary ranges.' },
              { n: '03', title: 'find the gaps',      body: 'AI generates a prioritised skill gap report with weeks to learn and salary impact.' },
              { n: '04', title: 'come back richer',   body: 'HydraDB stores everything. Next visit picks up exactly where you left off.' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#1c1c1c', borderRadius: 12, padding: 'clamp(14px,2vw,22px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, color: '#2e2e2e', marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontSize: 'clamp(11px, 1vw, 14px)', fontWeight: 700, color: '#f0f0ee', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', color: '#555550', lineHeight: 1.75 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <div style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(40px,6vw,72px) clamp(20px,4vw,48px)', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', color: '#555550', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>// ready to map your career? //</div>
        <div style={{ fontSize: 'clamp(18px, 2.5vw, 32px)', fontWeight: 700, color: '#f0f0ee', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 12 }}>
          Your career. One screen.<br />Always remembered.
        </div>
        <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)', color: '#555550', marginBottom: 'clamp(24px,3vw,40px)' }}>Free · Open source · Built in 48h</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button" onClick={onStart} style={btnFill}
            onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
          >
            {isReturning ? 'start fresh →' : 'launch devradar →'}
          </button>
          {isReturning && (
            <button
              type="button" onClick={onContinue} style={btnGhost}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)' }}
            >
              my graph →
            </button>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ padding: 'clamp(24px,3vw,40px) clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button type="button" onClick={onStart} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={22} />
          <span style={{ fontSize: 'clamp(11px, 1vw, 13px)', fontWeight: 700, color: '#555550' }}>devradar</span>
          <span style={{ fontSize: 9, color: '#2e2e2e', marginLeft: 4, letterSpacing: '0.06em' }}>WikiThon 2026</span>
        </button>
        <div style={{ display: 'flex', gap: 20 }}>
          {['github', 'vercel', 'backend', 'seed demo'].map(l => (
            <span key={l} style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', color: '#3a3a3a', letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase' }}
              onMouseOver={e => { e.currentTarget.style.color = '#888880' }}
              onMouseOut={e => { e.currentTarget.style.color = '#3a3a3a' }}
            >{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatCard({ title, body, children }) {
  return (
    <div
      style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 'clamp(18px,2vw,28px)', transition: 'border-color 0.2s' }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,245,60,.2)' }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a2200', border: '1px solid rgba(212,245,60,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(10px,1.5vw,18px)' }}>
        {children}
      </div>
      <div style={{ fontSize: 'clamp(12px, 1.2vw, 15px)', fontWeight: 700, color: '#f0f0ee', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: '#555550', lineHeight: 1.8 }}>{body}</div>
    </div>
  )
}
