import { useEffect, useMemo, useRef } from 'react'
import { Network } from 'vis-network/standalone'
import { Icon } from './icons.jsx'
import { useTheme } from '../hooks/useTheme.js'

/** Read a CSS custom property from :root at call time (theme-reactive). */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Build vis-network OPTIONS using current CSS vars — called fresh each render. */
function buildOptions() {
  const text   = cssVar('--text')
  const bgBase = cssVar('--bg-base')
  const edge   = cssVar('--node-edge')
  const accent = cssVar('--accent')

  return {
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 130,
        springConstant: 0.08,
      },
      stabilization: { iterations: 150 },
    },
    nodes: {
      shape: 'dot',
      font: {
        color: text,
        size: 13,
        face: 'Inter',
        strokeWidth: 4,
        strokeColor: bgBase,
      },
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.14)',
        size: 8,
        x: 0,
        y: 2,
      },
    },
    edges: {
      smooth: { type: 'continuous' },
      color: {
        color: edge,
        highlight: accent,
        hover: accent,
        opacity: 0.6,
      },
      width: 1.5,
      selectionWidth: 2.5,
    },
    interaction: {
      hover: true,
      tooltipDelay: 80,
      zoomView: true,
      dragView: true,
    },
    groups: {
      user: {
        color: { background: cssVar('--node-user'),      border: cssVar('--node-user') },
        size: 28,
        font: { size: 14, bold: true, color: bgBase },
      },
      skill_known: {
        color: { background: cssVar('--node-skill'),     border: cssVar('--node-skill') },
        size: 14,
      },
      skill_gap: {
        color: { background: cssVar('--node-gap'),       border: cssVar('--node-gap') },
        size: 12,
        borderDashes: [4, 2],
      },
      startup: {
        color: { background: cssVar('--node-company'),   border: cssVar('--node-company') },
        size: 18,
      },
      hackathon: {
        color: { background: cssVar('--node-hackathon'), border: cssVar('--node-hackathon') },
        size: 16,
      },
    },
  }
}

function nodeStyle(node, faded = false, selected = false) {
  const base   = cssVar(`--node-${node.group === 'skill_known' ? 'skill' : node.group === 'skill_gap' ? 'gap' : node.group === 'startup' ? 'company' : node.group}`)
  const bgSurf = cssVar('--bg-surface0')
  const accent = cssVar('--accent')
  const text   = cssVar('--text')
  const muted  = cssVar('--text-faint')

  return {
    ...node,
    borderWidth: selected ? 3 : 2,
    color: selected
      ? { background: bgSurf, border: accent }
      : { background: faded ? `${base}44` : base, border: faded ? `${base}44` : base },
    font: {
      ...buildOptions().nodes.font,
      color: faded ? muted : (node.group === 'user' ? cssVar('--bg-base') : text),
    },
    shadow: selected
      ? { enabled: true, color: `${accent}44`, size: 20, x: 0, y: 0 }
      : buildOptions().nodes.shadow,
  }
}

export default function CareerGraph({
  graph,
  selectedNode,
  onSelectNode,
  filter,
  setFilter,
  onOpenSidebar,
  children,
}) {
  const containerRef = useRef(null)
  const networkRef   = useRef(null)
  const { theme }    = useTheme() // triggers re-render on theme change

  const visibleGraph = useMemo(() => {
    if (filter === 'all') return graph
    const allowed = {
      skills:     new Set(['user', 'skill_known', 'skill_gap']),
      startups:   new Set(['user', 'skill_known', 'skill_gap', 'startup']),
      hackathons: new Set(['user', 'skill_known', 'skill_gap', 'hackathon']),
    }[filter]
    const nodes = graph.nodes.filter(node => allowed?.has(node.group))
    const ids   = new Set(nodes.map(node => node.id))
    const edges = graph.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to))
    return { nodes, edges }
  }, [graph, filter])

  // Recreate network when graph data or theme changes
  useEffect(() => {
    if (!containerRef.current) return
    const options = buildOptions()
    const network = new Network(
      containerRef.current,
      { nodes: visibleGraph.nodes.map(node => nodeStyle(node)), edges: visibleGraph.edges },
      options,
    )
    networkRef.current = network
    network.on('click', params => {
      const nodeId = params.nodes?.[0]
      if (!nodeId) { onSelectNode(null); return }
      onSelectNode(graph.nodeMap.get(nodeId))
    })
    return () => network.destroy()
  }, [visibleGraph, graph.nodeMap, onSelectNode, theme]) // theme → recreate with new colors

  // Update node/edge styles on selection change
  useEffect(() => {
    const network = networkRef.current
    if (!network) return
    const selectedId  = selectedNode?.id
    const connected   = selectedId ? new Set(network.getConnectedNodes(selectedId)) : null
    const accent      = cssVar('--accent')
    const edgeBase    = cssVar('--node-edge')
    const surfFaded   = cssVar('--bg-surface1')

    const nodes = visibleGraph.nodes.map(node => {
      const sel   = node.id === selectedId
      const faded = selectedId && !sel && !connected.has(node.id)
      return nodeStyle(node, faded, sel)
    })

    const edges = visibleGraph.edges.map(edge => {
      const active = selectedId && (
        edge.from === selectedId ||
        edge.to   === selectedId ||
        (connected?.has(edge.from) && connected?.has(edge.to))
      )
      return {
        ...edge,
        color: active
          ? { color: accent,    opacity: 0.9 }
          : selectedId
            ? { color: surfFaded, opacity: 0.2 }
            : { color: edgeBase,  opacity: 0.65 },
      }
    })

    network.setData({ nodes, edges })
    if (selectedId) {
      network.selectNodes([selectedId])
      network.focus(selectedId, { scale: 1.15, animation: { duration: 350, easingFunction: 'easeInOutQuad' } })
    }
  }, [selectedNode, visibleGraph, theme])

  // Node colors for the legend — read live from CSS vars
  const legendItems = [
    ['You',              cssVar('--node-user')],
    ['Skills you know',  cssVar('--node-skill')],
    ['Skills to learn',  cssVar('--node-gap')],
    ['Startups',         cssVar('--node-company')],
    ['Hackathons',       cssVar('--node-hackathon')],
  ]

  return (
    <section className="graph-zone">
      <div className="graph-topbar">
        <div className="topbar-left">
          <button className="icon-button hamburger" type="button" onClick={onOpenSidebar} aria-label="Open sidebar">
            <Icon name="menu" />
          </button>
          <Icon name="graph" />
          <span className="topbar-title">Career Graph</span>
          <span className="topbar-stats">·</span>
          <span className="topbar-stats">{graph.nodes.length} nodes · {graph.edges.length} connections</span>
        </div>

        <div className="topbar-right">
          <button className="icon-button mobile-search" type="button" aria-label="Search graph">
            <Icon name="search" />
          </button>
          <div className="segmented" aria-label="Graph filter">
            {[
              ['all',        'All'],
              ['skills',     'Skills'],
              ['startups',   'Startups'],
              ['hackathons', 'Hackathons'],
            ].map(([id, label]) => (
              <button
                className={`segment-button ${filter === id ? 'active' : ''}`}
                key={id}
                type="button"
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="topbar-separator desktop-actions" />
          <button className="icon-button desktop-actions" type="button" onClick={() => networkRef.current?.fit({ animation: true })} aria-label="Fit graph">
            <Icon name="refresh" />
          </button>
          <button className="icon-button desktop-actions" type="button" onClick={() => networkRef.current?.fit({ animation: true })} aria-label="Fullscreen">
            <Icon name="fullscreen" />
          </button>
        </div>
      </div>

      {children}

      <div className="graph-canvas">
        <div className="graph-network" ref={containerRef} />
      </div>

      <div className="node-legend">
        <p className="legend-title">Node Types</p>
        {legendItems.map(([label, color]) => (
          <div className="legend-row" key={label}>
            <span className="legend-dot" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      <div className="minimap">
        <svg className="minimap-svg" viewBox="0 0 120 80" aria-hidden="true">
          <line x1="24" y1="40" x2="54" y2="20" stroke={cssVar('--node-edge')} />
          <line x1="24" y1="40" x2="58" y2="58" stroke={cssVar('--node-edge')} />
          <line x1="54" y1="20" x2="94" y2="28" stroke={cssVar('--node-edge')} />
          <line x1="58" y1="58" x2="92" y2="52" stroke={cssVar('--node-edge')} />
          <circle cx="24" cy="40" r="7"  fill={cssVar('--node-user')} />
          <circle cx="54" cy="20" r="5"  fill={cssVar('--node-skill')} />
          <circle cx="58" cy="58" r="5"  fill={cssVar('--node-gap')} />
          <circle cx="94" cy="28" r="6"  fill={cssVar('--node-company')} />
          <circle cx="92" cy="52" r="6"  fill={cssVar('--node-hackathon')} />
        </svg>
      </div>
    </section>
  )
}
