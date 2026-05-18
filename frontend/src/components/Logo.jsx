import { useEffect, useRef } from 'react'

// ── Shared constants ──────────────────────────────────────────────────────────

const GRID = 13, CX = 6, CY = 6
const LIME = '#d4f53c'

// ── Radar draw ────────────────────────────────────────────────────────────────

function drawRadar(canvas, size, angle, pulse) {
  const ctx = canvas.getContext('2d')
  const PAD = size * 0.07
  const CELL = (size - PAD * 2) / (GRID - 1)
  const DR = Math.max(1, CELL * 0.32)
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, size, size)
  const ox = PAD, oy = PAD
  const sweep = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const px = ox + gx * CELL, py = oy + gy * CELL
      const dx = gx - CX, dy = gy - CY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 6.6) continue
      const isC = gx === CX && gy === CY
      const isB = gx === 9 && gy === 3
      const isR = Math.abs(dist - 2) < 0.58 || Math.abs(dist - 4) < 0.58 || Math.abs(dist - 6) < 0.58
      const isCr = (gx === CX || gy === CY) && dist <= 6.2
      const da = ((Math.atan2(dy, dx) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const trail = (sweep - da + Math.PI * 2) % (Math.PI * 2)
      let sb = 0
      if (!isC && dist > 0.5) {
        if (trail < 0.1) sb = 1
        else if (trail < 1.4) sb = 0.9 * (1 - (trail - 0.1) / 1.3)
      }
      let color, alpha = 1
      if (isC) {
        color = LIME
      } else if (isB) {
        color = LIME; alpha = sb > 0.5 ? 1 : 0.25 + Math.abs(Math.sin(pulse)) * 0.75
      } else if (sb > 0) {
        if (isR) {
          const t = sb
          color = `rgb(${Math.round(212 * t + 42 * (1 - t))},${Math.round(245 * t + 42 * (1 - t))},${Math.round(60 * t + 8 * (1 - t))})`
        } else {
          color = `rgba(212,245,60,${sb * 0.45})`
        }
      } else if (isR) { color = '#383830' }
      else if (isCr) { color = '#232320' }
      else { color = '#1e1e1c' }
      ctx.globalAlpha = alpha
      ctx.beginPath(); ctx.arc(px, py, DR, 0, Math.PI * 2)
      ctx.fillStyle = color; ctx.fill()
      ctx.globalAlpha = 1
    }
  }
  if (size >= 48) {
    const ll = (GRID / 2 - 0.5) * CELL
    ctx.beginPath()
    ctx.moveTo(ox + CX * CELL, oy + CY * CELL)
    ctx.lineTo(ox + CX * CELL + Math.cos(sweep) * ll, oy + CY * CELL + Math.sin(sweep) * ll)
    ctx.strokeStyle = 'rgba(212,245,60,0.15)'
    ctx.lineWidth = Math.max(0.5, size * 0.006)
    ctx.stroke()
  }
}

// ── Pixel font ────────────────────────────────────────────────────────────────

const FONT = {
  D: [[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,1,0],[1,1,1,0,0]],
  E: [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  V: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0]],
  R: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  A: [[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
}
const WORD = 'DEVRADAR'.split('')
const STEP_MAP = { sm: 6, md: 9, lg: 12, xl: 16 }
const DOT_R_MAP = { sm: 1.8, md: 2.8, lg: 3.8, xl: 5 }

// ── Exports ───────────────────────────────────────────────────────────────────

export function LogoMark({ size = 28, style }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let angle = 0, pulse = 0, raf
    const loop = () => {
      angle += 0.016; pulse += 0.065
      drawRadar(canvas, size, angle, pulse)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [size])
  return <canvas ref={ref} width={size} height={size} style={{ display: 'block', ...style }} />
}

export function LogoText({ size = 'lg', style }) {
  const ref = useRef(null)
  const STEP = STEP_MAP[size] ?? 12
  const DR = DOT_R_MAP[size] ?? 3.8
  const CHAR_W = 5 * STEP
  const GAP = STEP
  const W = WORD.length * CHAR_W + (WORD.length - 1) * GAP
  const H = 7 * STEP

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reveal = new Array(WORD.length * 35).fill(0)
    let revealFrame = 0, angle = 0, raf

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const sweep = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      WORD.forEach((ch, ci) => {
        const rows = FONT[ch] || FONT.D
        const charX = ci * (CHAR_W + GAP)
        rows.forEach((row, ry) => {
          row.forEach((px, rx) => {
            const x = charX + rx * STEP + STEP / 2
            const y = ry * STEP + STEP / 2
            const idx = ci * 35 + ry * 5 + rx
            const isLit = px === 1
            if (isLit && reveal[idx] < 1) reveal[idx] = Math.min(1, reveal[idx] + 0.07)
            ctx.globalAlpha = isLit ? reveal[idx] : 0.5
            let color
            if (isLit) {
              const a2 = Math.atan2(y - H / 2, x - W / 2)
              const da = ((a2 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
              const trail = (sweep - da + Math.PI * 2) % (Math.PI * 2)
              const sb = trail < 0.08 ? 1 : trail < 1.5 ? 0.8 * (1 - (trail - 0.08) / 1.42) : 0
              color = sb > 0.1
                ? `rgb(${Math.round(212 + 40 * sb)},${Math.round(245 * sb + 180 * (1 - sb))},${Math.round(60 * sb)})`
                : LIME
            } else {
              color = '#1e1e1c'
            }
            ctx.beginPath(); ctx.arc(x, y, DR, 0, Math.PI * 2)
            ctx.fillStyle = color; ctx.fill()
            ctx.globalAlpha = 1
          })
        })
      })
      if (revealFrame < 80) {
        const n = Math.floor(revealFrame * 2.5)
        for (let i = 0; i < Math.min(n, reveal.length); i++) {
          if (reveal[i] < 1) reveal[i] = Math.min(1, reveal[i] + 0.04)
        }
        revealFrame++
      }
      angle += 0.016
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [STEP, DR, CHAR_W, GAP, W, H])

  return <canvas ref={ref} width={W} height={H} style={{ display: 'block', maxWidth: '100%', ...style }} />
}
