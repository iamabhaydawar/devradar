import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Apply saved theme before first paint (prevents flash) ────────────────────
const savedTheme = localStorage.getItem('devradar_theme') || 'rosepine-dawn'
document.documentElement.setAttribute('data-theme', savedTheme)

// ── Styled console signature ──────────────────────────────────────────────────
console.log(
  '%c DevRadar ',
  'background:#00C4B4;color:#0A0F1E;font-weight:900;font-size:15px;border-radius:5px;padding:2px 10px;'
)
console.log(
  '%c Powered by HydraDB + Claude AI ',
  'color:#00C4B4;font-weight:600;font-size:12px;'
)
console.log(
  '%c WikiThon 2026 ',
  'color:#60a5fa;font-weight:600;font-size:12px;'
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
