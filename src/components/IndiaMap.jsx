import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';
import { Box, Typography, Chip, IconButton, Paper, Divider } from '@mui/material';
import { Add, Remove, CenterFocusStrong, Close, ZoomIn } from '@mui/icons-material';

const geoUrl = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/topojson/india.json';

// Each site exposes `apiKeys`: any of these strings matched against
// the API's location field will be used as the real count.
const locations = [
  {
    id: 'supa', name: 'Supa Warehouse', type: 'warehouse', shortType: 'Warehouse',
    apiKeys: ['Supa Warehouse', 'Supa', 'SUPA', 'supa'],
    coordinates: [74.3, 18.9], color: '#8B5CF6',
    insetLabel: { dx: 0, dy: -16, anchor: 'end' },
  },
  {
    id: 'minda', name: 'Minda Plant', type: 'assembly', shortType: 'Assembly',
    apiKeys: ['Minda Plant', 'Minda', 'MINDA', 'minda'],
    coordinates: [74.35, 19.0], color: '#3B82F6',
    insetLabel: { dx: 0, dy: -16, anchor: 'start' },
  },
  {
    id: 'nasrapur', name: 'Nasrapur', type: 'customer', shortType: 'Customer',
    apiKeys: ['Nasrapur', 'NASRAPUR', 'nasrapur'],
    coordinates: [74.0, 18.4], color: '#10B981',
    insetLabel: { dx: 0, dy: 18, anchor: 'end' },
  },
  {
    id: 'vitthlapur', name: 'Vitthlapur', type: 'customer', shortType: 'Customer',
    apiKeys: ['Vitthlapur', 'VITTHLAPUR', 'vitthlapur', 'Vitthalapur'],
    coordinates: [74.5, 18.5], color: '#10B981',
    insetLabel: { dx: 0, dy: 18, anchor: 'start' },
  },
  {
    id: 'gurgaon', name: 'Gurgaon', type: 'customer', shortType: 'Customer',
    apiKeys: ['Gurgaon', 'GURGAON', 'gurgaon', 'Gurugram'],
    coordinates: [77.0266, 28.4595], color: '#10B981',
    insetLabel: null,
  },
];

const PUNE_IDS = ['supa', 'minda', 'nasrapur', 'vitthlapur'];
const PUNE_CLUSTER_COORDS = [74.28, 18.72];

const findLoc = (id) => locations.find((l) => l.id === id);

const internalRoutes = [
  { from: 'supa', to: 'minda' },
  { from: 'minda', to: 'nasrapur' },
  { from: 'minda', to: 'vitthlapur' },
];

const adjacency = {
  supa: ['minda'],
  minda: ['supa', 'nasrapur', 'vitthlapur'],
  nasrapur: ['minda'],
  vitthlapur: ['minda'],
  gurgaon: [],
};
const getConnectedIds = (id) => new Set([id, ...(adjacency[id] || [])]);

// Resolve real count for a location from the prop map
const getCount = (loc, counts) => {
  if (!loc || !counts) return 0;
  for (const key of loc.apiKeys || []) {
    if (counts[key] != null) return counts[key];
  }
  return 0;
};

export default function IndiaMap({ locationCounts = {} }) {
  const [hovered, setHovered] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(false);
  const [selected, setSelected] = useState(null);
  const [position, setPosition] = useState({
    coordinates: [78.9629, 20.5937],
    zoom: 1.6,
  });

  const activeId = hovered || selected;
  const connectedIds = activeId ? getConnectedIds(activeId) : null;
  const selectedLoc = selected ? findLoc(selected) : null;
  const activeLoc = activeId ? findLoc(activeId) : null;

  const isDimmed = (id) => activeId && !connectedIds.has(id);
  const isPuneSelected = selected && PUNE_IDS.includes(selected);

  // Real counts
  const puneTotal = PUNE_IDS.reduce((sum, id) => sum + getCount(findLoc(id), locationCounts), 0);
  const gurgaonCount = getCount(findLoc('gurgaon'), locationCounts);
  const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 580, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
      <style>{`
        @keyframes dashFlow { to { stroke-dashoffset: -10; } }
        .route-line { animation: dashFlow 1s linear infinite; }
        @keyframes pulseR { 0% { r: 14; opacity: .45; } 100% { r: 34; opacity: 0; } }
        .cluster-pulse { animation: pulseR 2.2s ease-out infinite; }
      `}</style>

      {/* MAIN MAP */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1000, center: [78.9629, 20.5937] }}
        width={800}
        height={580}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={(pos) => setPosition(pos)}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#F2F4F7"
                  stroke="#E4E7EC"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#F2F4F7' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Trunk route: Pune Cluster → Gurgaon */}
          <Line
            from={PUNE_CLUSTER_COORDS}
            to={findLoc('gurgaon').coordinates}
            stroke={activeId ? '#5B5BD6' : '#98A2B3'}
            strokeWidth={activeId ? 2.5 : 1.5}
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="route-line"
            style={{ opacity: activeId ? 1 : 0.6, transition: 'all .25s', pointerEvents: 'none' }}
          />

          {/* Gurgaon node — real count as label suffix */}
          {(() => {
            const loc = findLoc('gurgaon');
            const isActive = activeId === loc.id;
            const dimmed = isDimmed(loc.id);
            const count = getCount(loc, locationCounts);
            return (
              <Marker
                coordinates={loc.coordinates}
                onMouseEnter={() => setHovered(loc.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === loc.id ? null : loc.id)}
                style={{ cursor: 'pointer', default: { outline: 'none' } }}
              >
                <circle r={(isActive ? 9 : 7) + 5} fill="#FFF" stroke={loc.color} strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ opacity: dimmed ? 0.25 : 1, transition: 'all .25s' }} />
                <circle r={isActive ? 9 : 7} fill={loc.color}
                  style={{ opacity: dimmed ? 0.25 : 1, transition: 'all .25s' }} />
                <text
                  textAnchor="middle" y={-16}
                  style={{
                    fontFamily: 'system-ui, sans-serif', fill: dimmed ? '#D0D5DD' : '#101828',
                    fontSize: isActive ? 12 : 10.5, fontWeight: 700, pointerEvents: 'none',
                    paintOrder: 'stroke', stroke: '#FFF', strokeWidth: 3, strokeLinejoin: 'round',
                    transition: 'all .25s',
                  }}
                >
                  {loc.name} · {count}
                </text>
              </Marker>
            );
          })()}

          {/* Pune cluster — real count in the badge */}
          <Marker
            coordinates={PUNE_CLUSTER_COORDS}
            onMouseEnter={() => setHoveredCluster(true)}
            onMouseLeave={() => setHoveredCluster(false)}
            onClick={() => setSelected(selected === 'minda' ? null : 'minda')}
            style={{ cursor: 'pointer', default: { outline: 'none' } }}
          >
            <circle className="cluster-pulse" fill="#8B5CF6" r={14} />
            <circle
              r={16} fill="#FFFFFF"
              stroke={hoveredCluster || isPuneSelected ? '#5B5BD6' : '#8B5CF6'}
              strokeWidth={hoveredCluster || isPuneSelected ? 2.5 : 2}
              strokeDasharray="4 3"
            />
            <circle r={11} fill="#8B5CF6" />
            <text
              textAnchor="middle" dy={4}
              style={{ fill: '#FFF', fontSize: 10, fontWeight: 800, pointerEvents: 'none' }}
            >
              {formatCount(puneTotal)}
            </text>
            <text
              textAnchor="middle" y={34}
              style={{
                fontFamily: 'system-ui, sans-serif',
                fill: hoveredCluster ? '#5B5BD6' : '#344054',
                fontSize: 11, fontWeight: 700, pointerEvents: 'none',
                paintOrder: 'stroke', stroke: '#FFF', strokeWidth: 3, strokeLinejoin: 'round',
              }}
            >
              Pune Cluster · {PUNE_IDS.length} sites ↗
            </text>
          </Marker>
        </ZoomableGroup>
      </ComposableMap>

      {/* PUNE INSET */}
      <Paper
        elevation={0}
        onMouseEnter={() => setHoveredCluster(true)}
        onMouseLeave={() => setHoveredCluster(false)}
        sx={{
          position: 'absolute', bottom: 16, right: 16, width: 300, height: 262,
          borderRadius: 2.5,
          border: `1px solid ${hoveredCluster || isPuneSelected ? '#C7C5F7' : '#EAECF0'}`,
          bgcolor: '#FFFFFF',
          boxShadow: hoveredCluster || isPuneSelected
            ? '0 8px 28px rgba(91,91,214,0.18)'
            : '0 6px 18px rgba(16,24,40,0.08)',
          overflow: 'hidden',
          transition: 'box-shadow .25s, border-color .25s',
          zIndex: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 1, borderBottom: '1px solid #F2F4F7' }}>
          <ZoomIn sx={{ fontSize: 15, color: '#5B5BD6' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>Pune Region</Typography>
          <Typography sx={{ fontSize: 11, color: '#98A2B3' }}>· {formatCount(puneTotal)} assets</Typography>
        </Box>

        <Box sx={{ width: '100%', height: 218 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 14000, center: [74.25, 18.7] }}
            width={300}
            height={218}
            style={{ width: '100%', height: '100%' }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#FAFBFC"
                    stroke="#EEF1F4"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#FAFBFC' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {internalRoutes.map((route, i) => {
              const fromLoc = findLoc(route.from);
              const toLoc = findLoc(route.to);
              const isActive = activeId && (route.from === activeId || route.to === activeId);
              const opacity = !activeId ? 0.7 : isActive ? 1 : 0.12;
              return (
                <Line
                  key={`inset-route-${i}`}
                  from={fromLoc.coordinates}
                  to={toLoc.coordinates}
                  stroke={isActive ? '#5B5BD6' : '#98A2B3'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeLinecap="round"
                  strokeDasharray="5 4"
                  className="route-line"
                  style={{ opacity, transition: 'all .25s', pointerEvents: 'none' }}
                />
              );
            })}

            {PUNE_IDS.map((id) => {
              const loc = findLoc(id);
              const isActive = activeId === id;
              const dimmed = isDimmed(id);
              const baseR = isActive ? 8 : 6;
              const count = getCount(loc, locationCounts);
              return (
                <Marker
                  key={id}
                  coordinates={loc.coordinates}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(selected === id ? null : id)}
                  style={{ cursor: 'pointer', default: { outline: 'none' } }}
                >
                  {loc.type === 'warehouse' && (
                    <circle r={9} fill={loc.color} opacity={0.3}>
                      <animate attributeName="r" values="9;20;20" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0;0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle r={baseR + 4} fill="#FFF" stroke={loc.color} strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ opacity: dimmed ? 0.25 : 1, transition: 'all .25s' }} />
                  <circle r={baseR} fill={loc.color}
                    style={{ opacity: dimmed ? 0.25 : 1, transition: 'all .25s' }} />
                  <text
                    textAnchor={loc.insetLabel.anchor}
                    x={loc.insetLabel.dx}
                    y={loc.insetLabel.dy}
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fill: dimmed ? '#D0D5DD' : '#101828',
                      fontSize: isActive ? 11 : 10,
                      fontWeight: 700,
                      pointerEvents: 'none',
                      paintOrder: 'stroke', stroke: '#FFF', strokeWidth: 3, strokeLinejoin: 'round',
                      transition: 'all .25s',
                    }}
                  >
                    {loc.name} · {count}
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>
        </Box>
      </Paper>

      {/* Zoom controls */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute', top: 16, right: 16, borderRadius: 2,
          border: '1px solid #EAECF0', bgcolor: '#FFF', p: 0.5,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(16,24,40,0.06)', zIndex: 2,
        }}
      >
        <IconButton size="small" onClick={() => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.4, 10) }))}>
          <Add fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.4, 1) }))}>
          <Remove fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setPosition({ coordinates: [78.9629, 20.5937], zoom: 1.6 })}>
          <CenterFocusStrong fontSize="small" />
        </IconButton>
      </Paper>

      {/* Legend */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute', top: 16, left: 16, borderRadius: 2,
          border: '1px solid #EAECF0', bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(6px)', px: 1.5, py: 1,
          display: 'flex', gap: 1.5, alignItems: 'center', zIndex: 2,
        }}
      >
        <LegendItem color="#8B5CF6" label="Warehouse" />
        <LegendItem color="#3B82F6" label="Assembly" />
        <LegendItem color="#10B981" label="Customer" />
      </Paper>

      {/* Hover tooltip — real count */}
      {hovered && !selected && activeLoc && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute', bottom: 296, right: 16, borderRadius: 2,
            border: '1px solid #EAECF0', bgcolor: '#FFF', px: 1.5, py: 1,
            boxShadow: '0 4px 12px rgba(16,24,40,0.06)', zIndex: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activeLoc.color }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>{activeLoc.name}</Typography>
            <Typography sx={{ fontSize: 11, color: '#667085' }}>· {activeLoc.shortType} · {getCount(activeLoc, locationCounts)} assets</Typography>
          </Box>
        </Paper>
      )}

      {/* Selected detail panel — real count */}
      {selectedLoc && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute', top: 64, left: 16, width: 240, borderRadius: 2,
            border: '1px solid #EAECF0', bgcolor: '#FFF',
            boxShadow: '0 8px 24px rgba(16,24,40,0.10)', overflow: 'hidden', zIndex: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: selectedLoc.color }} />
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#101828' }}>{selectedLoc.name}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelected(null)}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ p: 1.75 }}>
            <Label>Type</Label>
            <Value>{selectedLoc.shortType}</Value>
            <Label>Assets (from API)</Label>
            <Value>{getCount(selectedLoc, locationCounts).toLocaleString()} components</Value>
            <Label>Status</Label>
            <Chip
              label="Active"
              size="small"
              sx={{ bgcolor: '#ECFDF3', color: '#027A48', fontWeight: 600, fontSize: 11, height: 22, mt: 0.5 }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}

const LegendItem = ({ color, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
    <Typography sx={{ fontSize: 11, color: '#667085', fontWeight: 500 }}>{label}</Typography>
  </Box>
);

const Label = ({ children }) => (
  <Typography sx={{ fontSize: 11, color: '#667085', mb: 0.4 }}>{children}</Typography>
);

const Value = ({ children }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#101828', mb: 1.25 }}>{children}</Typography>
);