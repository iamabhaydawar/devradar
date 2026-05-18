export function Icon({ name, className = 'sidebar-icon' }) {
  const props = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'user':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
    case 'skill':
      return <svg {...props}><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="5" /></svg>
    case 'startup':
      return <svg {...props}><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" /><path d="M9 21v-4h3v4M8 7h1M12 7h1M8 11h1M12 11h1M19 21v-8h-2" /></svg>
    case 'hackathon':
      return <svg {...props}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 7H4a3 3 0 0 0 3 3M17 7h3a3 3 0 0 1-3 3" /></svg>
    case 'graph':
      return <svg {...props}><circle cx="6" cy="7" r="3" /><circle cx="18" cy="7" r="3" /><circle cx="12" cy="18" r="3" /><path d="M8.8 9.5 10.8 15.4M15.2 9.5 13.2 15.4M9 7h6" /></svg>
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    case 'refresh':
      return <svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
    case 'fullscreen':
      return <svg {...props}><path d="M8 3H3v5M21 8V3h-5M3 16v5h5M16 21h5v-5" /></svg>
    case 'menu':
      return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    case 'list':
      return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>
    case 'gap':
      return <svg {...props}><path d="m3 17 6-6 4 4 7-8" /><path d="M14 7h6v6" /></svg>
    default:
      return <svg {...props}><circle cx="12" cy="12" r="8" /></svg>
  }
}
