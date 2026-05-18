import { useMemo, useState } from 'react'
import { Icon } from './icons.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'

function scoreClass(score) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'blue'
  return 'warning'
}

function daysUntil(date) {
  if (!date) return 999
  return Math.max(0, Math.ceil((new Date(date) - new Date()) / 86400000))
}

function Item({ icon, label, active, children, onClick, indent = false }) {
  return (
    <button className={`sidebar-item ${active ? 'active' : ''} ${indent ? 'indent' : ''}`} type="button" onClick={onClick} title={label}>
      {icon}
      <span className="sidebar-item-text">{label}</span>
      {children}
    </button>
  )
}

export default function Sidebar({
  graph,
  selectedNode,
  onSelectNode,
  userStack,
  startups,
  hackathons,
  gapSkills,
  activeMobileView,
  setActiveMobileView,
  rightPanel,
  onSetRightPanel,
  wikiPageCount,
}) {
  const [tab, setTab] = useState('graph')
  const [query, setQuery] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const selectedId = selectedNode?.id
  const knownSkills = userStack.length ? userStack : ['React', 'Node.js', 'Python']

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return graph.nodeDetails.filter(node => {
      if (listFilter !== 'all') {
        if (listFilter === 'skills' && !['skill_known', 'skill_gap'].includes(node.type)) return false
        if (listFilter === 'startups' && node.type !== 'startup') return false
        if (listFilter === 'hackathons' && node.type !== 'hackathon') return false
      }
      return !q || node.label.toLowerCase().includes(q)
    })
  }, [graph.nodeDetails, query, listFilter])

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="wordmark-row">
          <p className="wordmark">DevRadar</p>
        </div>
        <span className="event-badge">WikiThon 2026</span>
        <div className="sidebar-divider" />
      </div>

      <div className="sidebar-tabs">
        {['graph', 'list'].map(id => (
          <button className={`sidebar-tab ${tab === id ? 'active' : ''}`} key={id} type="button" onClick={() => setTab(id)}>
            {id === 'graph' ? 'Graph' : 'List'}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <>
          <div className="list-search">
            <Icon name="search" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search..." />
          </div>
          <div className="filter-chips">
            {['all', 'skills', 'startups', 'hackathons'].map(id => (
              <button className={`chip ${listFilter === id ? 'active' : ''}`} key={id} type="button" onClick={() => setListFilter(id)}>
                {id === 'all' ? 'All' : id[0].toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <div className="sidebar-section">
            {results.map(node => (
              <Item
                key={node.id}
                label={node.label}
                active={selectedId === node.id || activeMobileView === node.mobileView}
                icon={<Icon name={node.icon} />}
                onClick={() => {
                  onSelectNode(node)
                  if (node.mobileView) setActiveMobileView(node.mobileView)
                }}
              >
                {node.score != null && <span className={`count-badge ${scoreClass(node.score)}`}>{node.score}%</span>}
              </Item>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sidebar-section">
            <p className="section-header">Overview</p>
            <Item
              active={selectedId === 'user'}
              label="Your Profile"
              icon={<Icon name="user" />}
              onClick={() => onSelectNode(graph.nodeMap.get('user'))}
            />
            <div className="sidebar-stack" style={{ padding: '0 12px 6px 36px' }}>
              {knownSkills.slice(0, 3).join(' Â· ')}
            </div>
          </div>

          <div className="sidebar-section">
            <p className="section-header">Skills</p>
            <Item label="Known" icon={<Icon name="skill" />} onClick={() => setActiveMobileView('gaps')}>
              <span className="count-badge success">{knownSkills.length}</span>
            </Item>
            {knownSkills.slice(0, 7).map(skill => (
              <Item
                indent
                key={skill}
                label={skill}
                active={selectedId === `skill-known:${skill}`}
                icon={<span className="dot known" />}
                onClick={() => onSelectNode(graph.nodeMap.get(`skill-known:${skill}`))}
              />
            ))}
            <Item label="To Learn" icon={<Icon name="gap" />} onClick={() => setActiveMobileView('gaps')}>
              <span className="count-badge danger">{gapSkills.length}</span>
            </Item>
            {gapSkills.slice(0, 7).map(skill => (
              <Item
                indent
                key={skill.skill}
                label={skill.skill}
                active={selectedId === `skill-gap:${skill.skill}`}
                icon={<span className="dot gap" />}
                onClick={() => onSelectNode(graph.nodeMap.get(`skill-gap:${skill.skill}`))}
              />
            ))}
          </div>

          <div className="sidebar-section">
            <p className="section-header">Startups</p>
            {startups.slice(0, 8).map(startup => {
              const score = startup.claude_analysis?.match_percentage ?? startup.match_score ?? 0
              return (
                <Item
                  key={startup.id}
                  label={startup.name}
                  active={selectedId === `startup:${startup.id}` || activeMobileView === 'startups'}
                  icon={<Icon name="startup" />}
                  onClick={() => {
                    onSelectNode(graph.nodeMap.get(`startup:${startup.id}`))
                    setActiveMobileView('startups')
                  }}
                >
                  <span className={`count-badge ${scoreClass(score)}`}>{score}%</span>
                </Item>
              )
            })}
          </div>

          <div className="sidebar-section">
            <p className="section-header">Hackathons</p>
            {hackathons.slice(0, 7).map(hackathon => {
              const days = daysUntil(hackathon.deadline)
              return (
                <Item
                  key={hackathon.id}
                  label={hackathon.name}
                  active={selectedId === `hackathon:${hackathon.id}` || activeMobileView === 'hackathons'}
                  icon={<Icon name="hackathon" />}
                  onClick={() => {
                    onSelectNode(graph.nodeMap.get(`hackathon:${hackathon.id}`))
                    setActiveMobileView('hackathons')
                  }}
                >
                  {days < 14 && <span className="count-badge danger">{days} days</span>}
                </Item>
              )
            })}
          </div>
        </>
      )}

      {onSetRightPanel && (
        <div className="sidebar-actions">
          <button
            className={`sidebar-action-btn ${rightPanel === 'ingest' ? 'active' : ''}`}
            type="button"
            onClick={() => onSetRightPanel(rightPanel === 'ingest' ? null : 'ingest')}
            title="Feed your career wiki"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="sidebar-item-text">Ingest</span>
            {(wikiPageCount ?? 0) > 0 && <span className="count-badge blue">{wikiPageCount}</span>}
          </button>

          <button
            className={`sidebar-action-btn ${rightPanel === 'chat' ? 'active' : ''}`}
            type="button"
            onClick={() => onSetRightPanel(rightPanel === 'chat' ? null : 'chat')}
            title="Chat with your career wiki"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="sidebar-item-text">Chat</span>
          </button>

          <button
            className={`sidebar-action-btn ${rightPanel === 'roadmap' ? 'active' : ''}`}
            type="button"
            onClick={() => onSetRightPanel(rightPanel === 'roadmap' ? null : 'roadmap')}
            title="View your learning roadmap"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="sidebar-item-text">Roadmap</span>
          </button>

          <button
            className={`sidebar-action-btn ${rightPanel === 'journey' ? 'active' : ''}`}
            type="button"
            onClick={() => onSetRightPanel(rightPanel === 'journey' ? null : 'journey')}
            title="View your career journey"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="sidebar-item-text">Journey</span>
          </button>
        </div>
      )}

      <div className="sidebar-bottom">
        <p className="caption">{graph.nodes.length} nodes Â· {graph.edges.length} connections</p>
        <div className="memory-active"><span className="pulse-dot" /> HydraDB active</div>
      </div>

      <ThemeSwitcher />
    </aside>
  )
}

