'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// ─── Geographic Data ───────────────────────────────────────────────────────────

interface RegionConfig {
  center: { lat: number; lng: number };
  marker?: { x: number; y: number };
  markerLabelOffset?: { x: number; y: number };
  zoom: number;
  label: string;
  region: string;
  states: string[];
}

// Focused region configurations for dynamic map display
const REGION_CONFIG: Record<string, RegionConfig> = {
  northeast: {
    center: { lat: 26.1445, lng: 91.7362 },
    marker: { x: 190, y: 100 },
    markerLabelOffset: { x: 16, y: -14 },
    zoom: 5.5,
    label: 'Guwahati',
    region: 'Northeast India',
    states: ['Assam', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Meghalaya', 'Sikkim']
  },
  bengal: {
    center: { lat: 22.5726, lng: 88.3639 },
    marker: { x: 248, y: 149 },
    zoom: 6,
    label: 'Kolkata',
    region: 'West Bengal',
    states: ['West Bengal']
  },
  tamil: {
    center: { lat: 13.0827, lng: 80.2707 },
    marker: { x: 176, y: 314 },
    zoom: 6,
    label: 'Chennai',
    region: 'Tamil Nadu',
    states: ['Tamil Nadu']
  },
  hindi: {
    center: { lat: 26.8467, lng: 80.9462 },
    marker: { x: 132, y: 112 },
    zoom: 5,
    label: 'Lucknow',
    region: 'North India',
    states: ['Uttar Pradesh', 'Bihar', 'Haryana', 'Delhi', 'Rajasthan', 'Uttarakhand', 'Himachal Pradesh', 'Chhattisgarh', 'Madhya Pradesh']
  },
  punjab: {
    center: { lat: 31.6340, lng: 74.8723 },
    marker: { x: 82, y: 88 },
    zoom: 6,
    label: 'Amritsar',
    region: 'Punjab & Haryana',
    states: ['Punjab', 'Haryana', 'Delhi']
  },
  maharashtra: {
    center: { lat: 19.0760, lng: 72.8777 },
    marker: { x: 92, y: 220 },
    zoom: 5.5,
    label: 'Mumbai',
    region: 'Maharashtra',
    states: ['Maharashtra', 'Goa']
  },
  telugu: {
    center: { lat: 17.3850, lng: 78.4867 },
    marker: { x: 167, y: 220 },
    zoom: 5.5,
    label: 'Hyderabad',
    region: 'Andhra Pradesh',
    states: ['Andhra Pradesh', 'Telangana']
  },
  karnataka: {
    center: { lat: 12.9716, lng: 77.5946 },
    marker: { x: 137, y: 255 },
    zoom: 5.5,
    label: 'Bengaluru',
    region: 'Karnataka',
    states: ['Karnataka']
  },
  kerala: {
    center: { lat: 8.5241, lng: 76.9366 },
    marker: { x: 133, y: 318 },
    zoom: 6.5,
    label: 'Kochi',
    region: 'Kerala',
    states: ['Kerala']
  },
  gujarat: {
    center: { lat: 23.0225, lng: 72.5714 },
    marker: { x: 62, y: 170 },
    zoom: 5.5,
    label: 'Ahmedabad',
    region: 'Gujarat',
    states: ['Gujarat']
  },
  odisha: {
    center: { lat: 20.2961, lng: 85.8245 },
    marker: { x: 195, y: 188 },
    zoom: 6,
    label: 'Bhubaneswar',
    region: 'Odisha',
    states: ['Odisha']
  },
  delhi: {
    center: { lat: 28.6139, lng: 77.2090 },
    marker: { x: 105, y: 100 },
    zoom: 6,
    label: 'New Delhi',
    region: 'Delhi NCR',
    states: ['Delhi']
  },
  // International regions
  uk: {
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 5,
    label: 'London',
    region: 'United Kingdom',
    states: []
  },
  usa: {
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 4,
    label: 'New York',
    region: 'United States',
    states: []
  },
  australia: {
    center: { lat: -33.8688, lng: 151.2093 },
    zoom: 4,
    label: 'Sydney',
    region: 'Australia',
    states: []
  },
  canada: {
    center: { lat: 43.6532, lng: -79.3832 },
    zoom: 4,
    label: 'Toronto',
    region: 'Canada',
    states: []
  }
};

// Simplified state paths for focused regional display
const STATE_PATHS: Record<string, string> = {
  // Northeast States
  'Assam': 'M180,85 L200,82 L215,88 L220,95 L218,105 L210,110 L195,108 L185,102 L180,95 Z',
  'Arunachal Pradesh': 'M210,55 L235,48 L260,55 L275,68 L278,82 L270,88 L255,85 L240,78 L225,70 L215,62 Z',
  'Nagaland': 'M225,92 L240,90 L250,95 L252,105 L248,112 L235,110 L228,102 Z',
  'Manipur': 'M235,115 L250,112 L258,120 L262,135 L258,148 L245,150 L235,142 L232,128 Z',
  'Mizoram': 'M220,138 L235,135 L242,145 L245,158 L242,170 L230,172 L220,162 L218,148 Z',
  'Tripura': 'M200,145 L215,142 L220,152 L222,165 L218,175 L205,172 L200,160 Z',
  'Meghalaya': 'M195,115 L215,112 L222,122 L220,135 L210,140 L198,135 L192,125 Z',
  'Sikkim': 'M175,72 L188,70 L192,78 L188,88 L178,85 Z',

  // Other Indian States (simplified for context)
  'West Bengal': 'M220,120 L250,115 L265,125 L270,145 L265,160 L250,165 L235,158 L225,145 Z',
  'Tamil Nadu': 'M155,280 L180,275 L195,285 L200,305 L192,325 L175,335 L155,332 L142,318 L145,298 Z',
  'Karnataka': 'M110,225 L145,220 L165,235 L170,260 L158,282 L132,288 L115,275 L105,250 Z',
  'Kerala': 'M128,290 L142,285 L148,305 L145,328 L135,338 L125,320 Z',
  'Andhra Pradesh': 'M165,235 L205,230 L225,245 L228,275 L215,295 L190,298 L172,280 L165,260 Z',
  'Telangana': 'M145,205 L175,200 L188,215 L185,238 L165,242 L148,232 Z',
  'Maharashtra': 'M85,180 L125,175 L145,195 L142,225 L118,242 L85,238 L65,215 Z',
  'Gujarat': 'M35,140 L70,135 L88,155 L85,185 L72,208 L48,202 L35,180 Z',
  'Rajasthan': 'M48,105 L95,100 L115,125 L108,155 L82,168 L55,158 L42,135 Z',
  'Delhi': 'M98,95 L108,92 L112,102 L105,108 Z',
  'Punjab': 'M65,75 L95,70 L105,88 L98,105 L72,108 L58,92 Z',
  'Haryana': 'M75,95 L105,92 L115,110 L105,125 L80,128 L68,115 Z',
  'Uttar Pradesh': 'M108,85 L145,80 L162,95 L158,130 L135,145 L115,138 L102,118 Z',
  'Bihar': 'M165,105 L195,100 L205,115 L198,138 L175,142 L165,128 Z',
  'Odisha': 'M175,165 L205,160 L218,175 L215,198 L195,210 L175,200 L168,180 Z',
  'Madhya Pradesh': 'M95,155 L135,150 L152,172 L148,198 L118,212 L92,198 L85,175 Z',
  'Chhattisgarh': 'M138,165 L170,160 L180,180 L175,205 L150,210 L140,195 Z',
  'Jharkhand': 'M175,145 L198,140 L208,158 L200,175 L180,172 Z',
  'Goa': 'M75,225 L85,222 L88,230 L82,238 Z',
  'Jammu & Kashmir': 'M45,25 L85,20 L105,38 L95,65 L65,68 L42,55 Z',
  'Ladakh': 'M85,15 L125,12 L142,35 L135,55 L108,58 Z',
  'Himachal Pradesh': 'M88,60 L110,55 L118,72 L108,82 L92,78 Z',
  'Uttarakhand': 'M100,72 L120,68 L128,85 L118,95 L102,90 Z'
};

// Region keywords for detection
const REGION_KEYWORDS: Record<string, string[]> = {
  northeast: ['assamese', 'assam', 'northeast', 'arunachal', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'sikkimese'],
  bengal: ['bengali', 'west bengal', 'kolkata', 'bengal', 'bangla'],
  tamil: ['tamil', 'chennai', 'madurai', 'coimbatore'],
  hindi: ['hindi', 'up ', 'uttar pradesh', 'bihar', 'bihari', 'north indian', 'delhi', 'delhite', 'haryanvi', 'rajasthani', 'chhattisgarhi'],
  punjab: ['punjabi', 'haryana', 'punjab', 'chandigarh', 'amritsar', 'ludhiana'],
  maharashtra: ['marathi', 'maharashtra', 'mumbai', 'pune', 'nagpur'],
  telugu: ['telugu', 'andhra', 'andhra pradesh', 'hyderabad', 'telangana', 'vijayawada'],
  karnataka: ['kannada', 'karnataka', 'bangalore', 'bengaluru', 'mangalore', 'mysore', 'hubli'],
  kerala: ['malayalam', 'kerala', 'kochi', 'kozhikode', 'kottayam', 'malayali'],
  gujarat: ['gujarati', 'gujarat', 'ahmedabad', 'surat', 'vadodara', 'gandhinagar'],
  odisha: ['odia', 'odisha', 'orissa', 'bhubaneswar', 'cuttack', 'oriya'],
  uk: ['british', 'rp', 'uk', 'scottish', 'welsh', 'irish', 'english', 'britain', 'scotland', 'wales', 'england', 'london', 'liverpool', 'manchester'],
  usa: ['american', 'general american', 'us ', 'southern us', 'boston', 'new york', 'california', 'texas', 'southern', 'midwest', 'californian', 'new yorker', 'texan', 'appalachian'],
  australia: ['australian', 'aussie', 'strine', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
  canada: ['canadian', 'canada', 'toronto', 'vancouver', 'montreal', 'ottawa', 'quebec'],
};

function detectRegion(accentIdentified: string): string {
  const accent = accentIdentified.toLowerCase().trim();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(keyword => accent.includes(keyword))) return region;
  }
  return 'delhi';
}

function isWorldRegion(region: string): boolean {
  return ['uk', 'usa', 'australia', 'canada'].includes(region);
}

// ─── Focused India Map Component ────────────────────────────────────────────────

function IndiaRegionMap({ regionKey }: { regionKey: string }) {
  const config = REGION_CONFIG[regionKey] || REGION_CONFIG.delhi;
  const isNortheast = regionKey === 'northeast';
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

  // Get states to display
  const primaryStates = config.states;
  const neighboringStates = getNeighboringStates(primaryStates);
  const allVisibleStates = [...new Set([...primaryStates, ...neighboringStates])];

  // Filter to only states we have paths for
  const displayStates = allVisibleStates.filter(state => STATE_PATHS[state]);

  return (
    <div className="focused-region-map">
      <div className="map-container">
        <svg viewBox="0 0 300 350" className="region-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="regionBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafb" />
              <stop offset="100%" stopColor="#f0f4f8" />
            </linearGradient>
            <linearGradient id="primaryStateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(20,184,166,0.25)" />
              <stop offset="100%" stopColor="rgba(20,184,166,0.12)" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width="300" height="350" fill="url(#regionBg)" rx="8" />

          {/* Context states (dimmed) */}
          {displayStates
            .filter(state => !primaryStates.includes(state))
            .map((state, i) => (
              <motion.path
                key={`context-${state}`}
                d={STATE_PATHS[state]}
                fill="rgba(200,210,220,0.3)"
                stroke="rgba(150,160,170,0.3)"
                strokeWidth={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              />
            ))}

          {/* Primary highlighted states */}
          {primaryStates
            .filter(state => STATE_PATHS[state])
            .map((state, i) => (
              <motion.path
                key={`primary-${state}`}
                d={STATE_PATHS[state]}
                fill="url(#primaryStateGrad)"
                stroke="#14b8a6"
                strokeWidth={1.5}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                style={{ filter: 'url(#softGlow)' }}
              />
            ))}

          {/* State labels */}
          {primaryStates
            .filter(state => STATE_PATHS[state])
            .map((state) => {
              const center = getStateCenter(state);
              const shortName = getShortName(state);
              return (
                <motion.text
                  key={`label-${state}`}
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="7"
                  fontFamily="var(--font-mono), monospace"
                  fill="#0d9488"
                  fontWeight="600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {shortName}
                </motion.text>
              );
            })}

          {/* Location marker */}
          <RegionMarker config={config} />

          {/* Compass */}
          <g transform="translate(270, 30)">
            <circle r="14" fill="white" stroke="#e0e0e0" strokeWidth={1} />
            <path d="M 0,-10 L -3,-3 L 0,-5 L 3,-3 Z" fill="#14b8a6" />
            <text x="0" y="-12" fontSize="8" fontFamily="var(--font-mono)" fill="#14b8a6" textAnchor="middle" fontWeight="600">N</text>
          </g>

          {/* Scale indicator */}
          <g transform="translate(20, 320)">
            <rect x="-2" y="-8" width="54" height="20" fill="white" rx="2" opacity="0.9" />
            <line x1="0" y1="0" x2="50" y2="0" stroke="#666" strokeWidth={1.5} />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#666" strokeWidth={1.5} />
            <line x1="25" y1="-2" x2="25" y2="2" stroke="#999" strokeWidth={1} />
            <line x1="50" y1="-4" x2="50" y2="4" stroke="#666" strokeWidth={1.5} />
            <text x="25" y="12" fontSize="7" fontFamily="var(--font-mono)" fill="#666" textAnchor="middle">200 km</text>
          </g>

          {/* Region info panel */}
          <g transform="translate(20, 20)">
            <rect
              x="-8"
              y="-4"
              width="140"
              height={isInfoCollapsed ? 20 : 52}
              fill="white"
              rx="6"
              opacity="0.95"
              stroke="#14b8a6"
              strokeWidth={0.5}
            />
            <g
              onClick={() => setIsInfoCollapsed((prev) => !prev)}
              style={{ cursor: 'pointer' }}
            >
              <text x="0" y="10" fontSize="9" fontFamily="var(--font-mono)" fill="#14b8a6" fontWeight="600">{config.region}</text>
              <text x="122" y="10" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#14b8a6" fontWeight="700">
                {isInfoCollapsed ? '+' : '-'}
              </text>
            </g>
            {!isInfoCollapsed && (
              <>
                <text x="0" y="24" fontSize="8" fontFamily="var(--font-mono)" fill="#666">{config.label}</text>
                <text x="0" y="38" fontSize="7" fontFamily="var(--font-mono)" fill="#999">
                  {config.center.lat.toFixed(2)}°N, {config.center.lng.toFixed(2)}°E
                </text>
              </>
            )}
          </g>

          {/* Border */}
          <rect x="0.5" y="0.5" width="299" height="349" fill="none" stroke="#e0e0e0" strokeWidth={1} rx="8" />
        </svg>
      </div>

      {/* Northeast states indicator */}
      {isNortheast && (
        <motion.div
          className="sister-states-indicator"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="indicator-badge">8 Sister States</span>
          <span className="indicator-text">Assam • Arunachal • Nagaland • Manipur • Mizoram • Tripura • Meghalaya • Sikkim</span>
        </motion.div>
      )}
    </div>
  );
}

// Get short name for state
function getShortName(state: string): string {
  const shortNames: Record<string, string> = {
    'Assam': 'AS', 'Arunachal Pradesh': 'AR', 'Nagaland': 'NL', 'Manipur': 'MN',
    'Mizoram': 'MZ', 'Tripura': 'TR', 'Meghalaya': 'ML', 'Sikkim': 'SK',
    'West Bengal': 'WB', 'Tamil Nadu': 'TN', 'Karnataka': 'KA', 'Kerala': 'KL',
    'Andhra Pradesh': 'AP', 'Telangana': 'TS', 'Maharashtra': 'MH', 'Gujarat': 'GJ',
    'Rajasthan': 'RJ', 'Delhi': 'DL', 'Punjab': 'PB', 'Haryana': 'HR',
    'Uttar Pradesh': 'UP', 'Bihar': 'BR', 'Odisha': 'OD', 'Madhya Pradesh': 'MP',
    'Chhattisgarh': 'CG', 'Jharkhand': 'JH', 'Goa': 'GA', 'Jammu & Kashmir': 'J&K',
    'Ladakh': 'LA', 'Himachal Pradesh': 'HP', 'Uttarakhand': 'UK'
  };
  return shortNames[state] || state.substring(0, 2).toUpperCase();
}

// Get approximate center for state label
function getStateCenter(state: string): { x: number; y: number } {
  const centers: Record<string, { x: number; y: number }> = {
    'Assam': { x: 200, y: 95 }, 'Arunachal Pradesh': { x: 245, y: 68 },
    'Nagaland': { x: 240, y: 102 }, 'Manipur': { x: 248, y: 132 },
    'Mizoram': { x: 232, y: 155 }, 'Tripura': { x: 212, y: 158 },
    'Meghalaya': { x: 208, y: 128 }, 'Sikkim': { x: 185, y: 78 },
    'West Bengal': { x: 245, y: 142 }, 'Tamil Nadu': { x: 172, y: 308 },
    'Karnataka': { x: 137, y: 255 }, 'Kerala': { x: 135, y: 315 },
    'Andhra Pradesh': { x: 196, y: 265 }, 'Telangana': { x: 167, y: 220 },
    'Maharashtra': { x: 105, y: 210 }, 'Gujarat': { x: 62, y: 170 },
    'Rajasthan': { x: 78, y: 130 }, 'Delhi': { x: 105, y: 100 },
    'Punjab': { x: 82, y: 88 }, 'Haryana': { x: 95, y: 110 },
    'Uttar Pradesh': { x: 132, y: 112 }, 'Bihar': { x: 185, y: 122 },
    'Odisha': { x: 195, y: 188 }, 'Madhya Pradesh': { x: 118, y: 175 },
    'Chhattisgarh': { x: 158, y: 185 }, 'Jharkhand': { x: 190, y: 158 },
    'Goa': { x: 80, y: 230 }, 'Jammu & Kashmir': { x: 75, y: 45 },
    'Ladakh': { x: 115, y: 35 }, 'Himachal Pradesh': { x: 102, y: 70 },
    'Uttarakhand': { x: 115, y: 80 }
  };
  return centers[state] || { x: 150, y: 175 };
}

// Get neighboring states for context
function getNeighboringStates(states: string[]): string[] {
  const neighbors: Record<string, string[]> = {
    'Assam': ['Arunachal Pradesh', 'Nagaland', 'Manipur', 'Meghalaya', 'Tripura', 'West Bengal'],
    'Arunachal Pradesh': ['Assam', 'Nagaland'],
    'Nagaland': ['Assam', 'Arunachal Pradesh', 'Manipur'],
    'Manipur': ['Assam', 'Nagaland', 'Mizoram'],
    'Mizoram': ['Manipur', 'Tripura'],
    'Tripura': ['Mizoram', 'Assam', 'West Bengal'],
    'Meghalaya': ['Assam', 'West Bengal'],
    'Sikkim': ['West Bengal'],
    'West Bengal': ['Sikkim', 'Assam', 'Meghalaya', 'Tripura', 'Bihar', 'Odisha', 'Jharkhand'],
    'Tamil Nadu': ['Karnataka', 'Andhra Pradesh', 'Kerala'],
    'Karnataka': ['Maharashtra', 'Goa', 'Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'],
    'Kerala': ['Karnataka', 'Tamil Nadu'],
    'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Odisha'],
    'Telangana': ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Chhattisgarh'],
    'Maharashtra': ['Gujarat', 'Madhya Pradesh', 'Chhattisgarh', 'Telangana', 'Karnataka', 'Goa'],
    'Gujarat': ['Rajasthan', 'Madhya Pradesh', 'Maharashtra'],
    'Rajasthan': ['Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat'],
    'Delhi': ['Haryana', 'Uttar Pradesh'],
    'Punjab': ['Jammu & Kashmir', 'Himachal Pradesh', 'Haryana', 'Rajasthan'],
    'Haryana': ['Punjab', 'Himachal Pradesh', 'Uttar Pradesh', 'Delhi', 'Rajasthan'],
    'Uttar Pradesh': ['Uttarakhand', 'Himachal Pradesh', 'Haryana', 'Delhi', 'Rajasthan', 'Madhya Pradesh', 'Chhattisgarh', 'Bihar'],
    'Bihar': ['Uttar Pradesh', 'Nepal', 'West Bengal', 'Jharkhand'],
    'Odisha': ['West Bengal', 'Jharkhand', 'Chhattisgarh', 'Andhra Pradesh'],
    'Madhya Pradesh': ['Rajasthan', 'Uttar Pradesh', 'Chhattisgarh', 'Maharashtra', 'Gujarat'],
    'Chhattisgarh': ['Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Telangana', 'Odisha', 'Bihar'],
    'Jharkhand': ['Bihar', 'West Bengal', 'Odisha', 'Chhattisgarh'],
    'Goa': ['Maharashtra', 'Karnataka'],
    'Jammu & Kashmir': ['Punjab', 'Himachal Pradesh', 'Ladakh'],
    'Ladakh': ['Jammu & Kashmir', 'Himachal Pradesh', 'Uttarakhand'],
    'Himachal Pradesh': ['Jammu & Kashmir', 'Ladakh', 'Uttarakhand', 'Haryana', 'Punjab'],
    'Uttarakhand': ['Himachal Pradesh', 'Ladakh', 'Uttar Pradesh', 'Haryana', 'Delhi']
  };

  const result: string[] = [];
  states.forEach(state => {
    if (neighbors[state]) {
      result.push(...neighbors[state]);
    }
  });
  return [...new Set(result)].filter(s => !states.includes(s));
}

// Location marker component
function RegionMarker({ config }: { config: RegionConfig }) {
  const pos = config.marker ?? mapLatLngToSvg(config.center.lat, config.center.lng);
  const labelWidth = 70;
  const autoLabelOffsetX = pos.x > 300 - (labelWidth + 16) ? -(labelWidth + 12) : 12;
  const labelOffsetX = config.markerLabelOffset?.x ?? autoLabelOffsetX;
  const labelOffsetY = config.markerLabelOffset?.y ?? -5;

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Pulse rings */}
      <motion.circle
        r={20}
        fill="rgba(20,184,166,0.1)"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        r={13}
        fill="rgba(20,184,166,0.2)"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      {/* Core marker */}
      <circle r={7} fill="#14b8a6" stroke="white" strokeWidth={2.5} />
      {/* Label */}
      <g transform={`translate(${labelOffsetX}, ${labelOffsetY})`}>
        <rect x="0" y="-10" width="70" height="20" rx="4" fill="white" stroke="#14b8a6" strokeWidth={0.5} opacity="0.95" />
        <text x="35" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontFamily="var(--font-mono)" fill="#1a1a1a" fontWeight="600">
          {config.label}
        </text>
      </g>
    </g>
  );
}

// Map lat/lng to SVG coordinates (simplified mercator)
function mapLatLngToSvg(lat: number, lng: number): { x: number; y: number } {
  // Approximate bounds for India-focused view
  const bounds = {
    minLat: 6, maxLat: 38,
    minLng: 67, maxLng: 98
  };

  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 300;
  const y = 350 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 350;

  return { x: Math.max(0, Math.min(300, x)), y: Math.max(0, Math.min(350, y)) };
}

// ─── World Region Card ─────────────────────────────────────────────────────────

function WorldRegionCard({ regionKey }: { regionKey: string }) {
  const config = REGION_CONFIG[regionKey];

  return (
    <div className="world-region-card">
      <div className="region-header">
        <span className="region-emoji">🌍</span>
        <div className="region-info">
          <div className="region-name">{config.region}</div>
          <div className="region-city">{config.label}</div>
        </div>
      </div>
      <div className="region-coordinates">
        {Math.abs(config.center.lat).toFixed(4)}°{config.center.lat >= 0 ? 'N' : 'S'},
        {Math.abs(config.center.lng).toFixed(4)}°{config.center.lng >= 0 ? 'E' : 'W'}
      </div>
      <div className="region-footer">International accent detected</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function AccentOriginMap({ accentIdentified }: { accentIdentified: string }) {
  const regionKey = detectRegion(accentIdentified);
  const isWorld = isWorldRegion(regionKey);
  const config = REGION_CONFIG[regionKey] || REGION_CONFIG.delhi;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="accent-origin-map"
    >
      <div className="map-header">
        <div className="header-left">
          <span className="map-title">Accent Origin</span>
          <span className="map-region">{config.region}</span>
        </div>
        <span className="map-badge">{isWorld ? '🌍 International' : '🇮🇳 India'}</span>
      </div>

      {isWorld ? (
        <WorldRegionCard regionKey={regionKey} />
      ) : (
        <IndiaRegionMap regionKey={regionKey} />
      )}
    </motion.div>
  );
}

// ─── Bias Mitigation Summary ────────────────────────────────────────────────────

export function BiasMitigationSummary({ accentIdentified, biasAnalysis }: {
  accentIdentified: string;
  biasAnalysis?: string;
}) {
  const regionKey = detectRegion(accentIdentified);

  const strategies: Record<string, { title: string; items: string[] }> = {
    northeast: {
      title: 'Northeast Phonetic Correction',
      items: [
        'Retroflex /d/ preservation — prevents 40% ASR confidence drop',
        'Vowel space expansion — corrects recognition boundary narrowing',
        'Tonal pattern mapping — Assamese pitch contour adaptation',
        'Glottal stop identification — corrects word boundary errors'
      ]
    },
    bengal: {
      title: 'Bengali Accent Adaptation',
      items: [
        'Voiced aspirated mapping — /bh/, /dh/, /jh/ recognition',
        'Labio-dental correction — non-velar /v/ preservation',
        'Retroflex distinction — /t̪/ vs /ʈ/ differentiation',
        'Syllable-final recovery — epenthetic vowel handling'
      ]
    },
    tamil: {
      title: 'Tamil-English Phonetic Bridge',
      items: [
        'Syllable-timing adaptation — equal stress recognition',
        'Retroflex preservation — /ɳ/, /ɭ/, /ɽ/ mapping',
        'Epenthesis handling — automatic schwa detection',
        'Vowel quantity normalization — length distinction'
      ]
    },
    hindi: {
      title: 'Hindi-English Phonetic Fusion',
      items: [
        'Dental-retroflex distinction — /t̪/ vs /ʈ/ preservation',
        'Aspiration recognition — breathy vs non-breathy',
        'Nasalization detection — vowel correction',
        'Stress remapping — syllable-timed adaptation'
      ]
    },
    default: {
      title: 'Regional Phonetic Correction',
      items: [
        'Accent-agnostic phonetic normalization',
        'Prosodic pattern adaptation',
        'Vowel system expansion',
        'Consonant cluster handling'
      ]
    }
  };

  const strategy = strategies[regionKey] || strategies.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bias-mitigation-summary"
    >
      <div className="mitigation-header">
        <span className="mitigation-label">Bias Correction</span>
      </div>
      <h4 className="mitigation-title">{strategy.title}</h4>
      <ul className="mitigation-list">
        {strategy.items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {item}
          </motion.li>
        ))}
      </ul>
      {biasAnalysis && (
        <div className="detected-bias">
          <span className="bias-label">Detected:</span>
          <span className="bias-text">{biasAnalysis}</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── CSS Styles ────────────────────────────────────────────────────────────────

export function AccentMapStyles() {
  return (
    <style>{`
      .accent-origin-map {
        font-family: var(--font-mono), 'SF Mono', 'Menlo', monospace;
      }

      .map-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border);
      }

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .map-title {
        font-size: 10px;
        color: var(--text-secondary);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-weight: 600;
      }

      .map-region {
        font-size: 13px;
        color: var(--text-primary);
        font-weight: 600;
      }

      .map-badge {
        font-size: 10px;
        padding: 4px 10px;
        background: rgba(20,184,166,0.08);
        border: 1px solid rgba(20,184,166,0.2);
        border-radius: 20px;
        color: var(--teal);
      }

      /* Focused Region Map */
      .focused-region-map {
        width: 100%;
      }

      .map-container {
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        border: 1px solid #14b8a6;
        border-radius: 12px;
        overflow: hidden;
        background: linear-gradient(180deg, #f8fafb 0%, #f0f4f8 100%);
      }

      .region-svg {
        width: 100%;
        height: auto;
        display: block;
      }

      @media (min-width: 1024px) {
        .map-container {
          max-width: 390px;
        }
      }

      .sister-states-indicator {
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(20,184,166,0.06);
        border: 1px solid rgba(20,184,166,0.15);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .indicator-badge {
        font-size: 9px;
        color: var(--teal);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .indicator-text {
        font-size: 10px;
        color: var(--text-secondary);
        line-height: 1.4;
      }

      /* World Region Card */
      .world-region-card {
        padding: 20px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: rgba(0,0,0,0.02);
      }

      .region-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }

      .region-emoji {
        font-size: 28px;
      }

      .region-info {
        flex: 1;
      }

      .region-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }

      .region-city {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .region-coordinates {
        font-size: 10px;
        color: var(--text-muted);
        font-family: var(--font-mono);
        letter-spacing: 0.02em;
        margin-bottom: 12px;
      }

      .region-footer {
        font-size: 10px;
        color: var(--text-muted);
        padding-top: 10px;
        border-top: 1px solid var(--border);
      }

      /* Bias Mitigation Summary */
      .bias-mitigation-summary {
        background: rgba(20,184,166,0.04);
        border: 1px solid rgba(20,184,166,0.15);
        border-radius: 10px;
        padding: 16px;
        margin-top: 16px;
      }

      .mitigation-header {
        margin-bottom: 10px;
      }

      .mitigation-label {
        display: inline-block;
        padding: 3px 8px;
        background: rgba(20,184,166,0.1);
        border: 1px solid rgba(20,184,166,0.25);
        border-radius: 4px;
        font-size: 9px;
        color: #14b8a6;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
      }

      .mitigation-title {
        font-size: 13px;
        color: var(--text-primary);
        font-weight: 600;
        margin: 0 0 12px 0;
      }

      .mitigation-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .mitigation-list li {
        position: relative;
        padding-left: 14px;
        margin-bottom: 8px;
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .mitigation-list li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: #14b8a6;
        font-weight: 600;
      }

      .detected-bias {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(20,184,166,0.15);
        font-size: 10px;
        line-height: 1.5;
      }

      .bias-label {
        color: var(--red);
        font-weight: 600;
        margin-right: 6px;
      }

      .bias-text {
        color: var(--text-secondary);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .map-container {
          max-width: 100%;
          border-radius: 10px;
        }

        .region-svg {
          max-height: none;
        }

        .map-header {
          gap: 8px;
        }
      }

      @media (max-width: 480px) {
        .map-container {
          border-radius: 8px;
        }

        .region-svg {
          max-height: none;
        }

        .map-header {
          flex-wrap: wrap;
        }

        .map-badge {
          margin-left: auto;
        }
      }

      /* Print Styles */
      @media print {
        .accent-origin-map {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .map-container {
          border: 1px solid rgba(0,0,0,0.15) !important;
          background: white !important;
          box-shadow: none !important;
          max-width: 280px !important;
        }

        .region-svg {
          max-height: 200px !important;
        }

        .sister-states-indicator {
          background: rgba(20,184,166,0.03) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
        }

        .bias-mitigation-summary {
          background: rgba(20,184,166,0.02) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          break-inside: avoid !important;
        }

        .mitigation-label {
          background: rgba(20,184,166,0.05) !important;
          border: 1px solid rgba(0,0,0,0.15) !important;
        }

        .world-region-card {
          background: white !important;
          border: 1px solid rgba(0,0,0,0.15) !important;
        }
      }
    `}</style>
  );
}
