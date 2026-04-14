'use client';

import { motion } from 'framer-motion';

const INDIA_VIEWBOX = "0 0 300 340";

// Real simplified India state SVG paths
const INDIA_STATES: Record<string, { path: string; labelX: number; labelY: number }> = {
  assam: {
    path: "M 218,68 L 228,62 L 242,65 L 252,58 L 258,63 L 255,72 L 248,78 L 238,82 L 228,80 L 220,75 Z",
    labelX: 238, labelY: 72,
  },
  westBengal: {
    path: "M 192,98 L 200,88 L 210,85 L 215,92 L 218,102 L 215,115 L 208,125 L 200,128 L 194,120 L 190,108 Z",
    labelX: 205, labelY: 108,
  },
  tamilNadu: {
    path: "M 158,222 L 168,215 L 178,218 L 182,232 L 178,248 L 168,258 L 158,255 L 152,242 L 152,230 Z",
    labelX: 167, labelY: 238,
  },
  uttarPradesh: {
    path: "M 130,78 L 148,72 L 165,74 L 172,82 L 168,95 L 158,100 L 142,98 L 130,92 Z",
    labelX: 150, labelY: 86,
  },
  punjab: {
    path: "M 95,52 L 108,48 L 118,52 L 120,62 L 112,68 L 100,66 L 92,60 Z",
    labelX: 107, labelY: 59,
  },
  maharashtra: {
    path: "M 108,148 L 125,140 L 148,142 L 158,152 L 155,168 L 142,178 L 122,178 L 108,168 L 105,155 Z",
    labelX: 132, labelY: 160,
  },
  andhraPradesh: {
    path: "M 155,175 L 172,168 L 188,172 L 195,185 L 190,200 L 175,208 L 160,205 L 152,192 Z",
    labelX: 173, labelY: 190,
  },
  karnataka: {
    path: "M 128,182 L 148,175 L 162,180 L 165,195 L 158,212 L 142,218 L 125,214 L 118,198 Z",
    labelX: 142, labelY: 198,
  },
  kerala: {
    path: "M 128,215 L 140,210 L 148,218 L 148,235 L 142,250 L 132,255 L 124,248 L 122,232 Z",
    labelX: 136, labelY: 232,
  },
  gujarat: {
    path: "M 82,105 L 100,98 L 115,102 L 120,118 L 115,135 L 100,140 L 82,135 L 75,120 Z",
    labelX: 98, labelY: 120,
  },
  odisha: {
    path: "M 188,145 L 202,140 L 215,145 L 218,158 L 212,172 L 198,178 L 185,172 L 182,158 Z",
    labelX: 200, labelY: 158,
  },
  delhi: {
    path: "M 138,75 L 145,72 L 150,76 L 148,83 L 140,85 L 135,80 Z",
    labelX: 143, labelY: 79,
  },
};

// India outer boundary
const INDIA_OUTLINE = "M 92,42 L 115,35 L 145,32 L 175,38 L 198,48 L 225,55 L 258,60 L 265,72 L 258,85 L 250,98 L 242,115 L 255,128 L 260,145 L 252,160 L 238,175 L 225,190 L 215,208 L 205,225 L 195,242 L 182,258 L 168,268 L 155,275 L 140,270 L 128,258 L 118,242 L 108,225 L 95,210 L 82,195 L 72,178 L 68,158 L 72,138 L 78,118 L 75,98 L 80,78 L 88,58 Z";

// City coordinates for pulsing dot
const CITY_COORDS: Record<string, { x: number; y: number; label: string }> = {
  northeast: { x: 238, y: 72, label: 'Guwahati' },
  bengal:    { x: 205, y: 108, label: 'Kolkata' },
  tamil:     { x: 167, y: 238, label: 'Chennai' },
  hindi:     { x: 150, y: 86, label: 'Lucknow' },
  punjab:    { x: 107, y: 59, label: 'Amritsar' },
  maharashtra: { x: 118, y: 158, label: 'Mumbai' },
  telugu:    { x: 173, y: 190, label: 'Hyderabad' },
  karnataka: { x: 142, y: 198, label: 'Bengaluru' },
  kerala:    { x: 136, y: 232, label: 'Thiruvananthapuram' },
  gujarat:   { x: 90, y: 120, label: 'Ahmedabad' },
  odisha:    { x: 200, y: 158, label: 'Bhubaneswar' },
  default:   { x: 143, y: 79, label: 'New Delhi' },
};

const REGION_STATE_MAP: Record<string, keyof typeof INDIA_STATES> = {
  northeast:   'assam',
  bengal:      'westBengal',
  tamil:       'tamilNadu',
  hindi:       'uttarPradesh',
  punjab:      'punjab',
  maharashtra: 'maharashtra',
  telugu:      'andhraPradesh',
  karnataka:   'karnataka',
  kerala:      'kerala',
  gujarat:     'gujarat',
  odisha:      'odisha',
  default:     'delhi',
};

const REGION_NAMES: Record<string, string> = {
  northeast:   'Northeast India',
  bengal:      'West Bengal',
  tamil:       'Tamil Nadu',
  hindi:       'North India',
  punjab:      'Punjab & Haryana',
  maharashtra: 'Maharashtra',
  telugu:      'Andhra Pradesh',
  karnataka:   'Karnataka',
  kerala:      'Kerala',
  gujarat:     'Gujarat',
  odisha:      'Odisha',
  default:     'India',
};

function detectRegion(accentIdentified: string): string {
  const accent = accentIdentified.toLowerCase();

  if (accent.includes('assamese') || accent.includes('assam') || accent.includes('northeast')) {
    return 'northeast';
  }

  if (accent.includes('bengali') || accent.includes('west bengal') || accent.includes('kolkata') || accent.includes('bengal')) {
    return 'bengal';
  }

  if (accent.includes('tamil') || accent.includes('chennai') || accent.includes('tamil')) {
    return 'tamil';
  }

  if (accent.includes('hindi') || accent.includes('up ') || accent.includes('bihar') || accent.includes('north indian') || accent.includes('delhi')) {
    return 'hindi';
  }

  if (accent.includes('punjabi') || accent.includes('haryana') || accent.includes('punjab')) {
    return 'punjab';
  }

  if (accent.includes('marathi') || accent.includes('maharashtra') || accent.includes('mumbai')) {
    return 'maharashtra';
  }

  if (accent.includes('telugu') || accent.includes('andhra') || accent.includes('hyderabad')) {
    return 'telugu';
  }

  if (accent.includes('kannada') || accent.includes('karnataka') || accent.includes('bangalore') || accent.includes('bengaluru')) {
    return 'karnataka';
  }

  if (accent.includes('malayalam') || accent.includes('kerala')) {
    return 'kerala';
  }

  if (accent.includes('gujarati') || accent.includes('gujarat')) {
    return 'gujarat';
  }

  if (accent.includes('odia') || accent.includes('odisha') || accent.includes('orissa')) {
    return 'odisha';
  }

  if (accent.includes('british') || accent.includes('rp') || accent.includes('uk') || accent.includes('english')) {
    return 'uk';
  }

  if (accent.includes('american') || accent.includes('general american') || accent.includes('us ')) {
    return 'usa';
  }

  if (accent.includes('australian') || accent.includes('aussie')) {
    return 'australia';
  }

  return 'default';
}

function isWorldRegion(region: string): boolean {
  return ['uk', 'usa', 'australia'].includes(region);
}

export function AccentOriginMap({ accentIdentified }: { accentIdentified: string }) {
  const region = detectRegion(accentIdentified);

  if (isWorldRegion(region)) {
    const regionNames: Record<string, string> = {
      uk: 'United Kingdom',
      usa: 'United States',
      australia: 'Australia',
    };
    const cityNames: Record<string, string> = {
      uk: 'London',
      usa: 'New York',
      australia: 'Sydney',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginTop: 14 }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-secondary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Origin Region
        </div>

        <div style={{
          padding: '20px 0',
          textAlign: 'center',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.02)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}>
            {cityNames[region]} · {regionNames[region]}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-secondary)',
            marginTop: 4,
          }}>
            (accent origin outside India)
          </div>
        </div>
      </motion.div>
    );
  }

  const stateKey = REGION_STATE_MAP[region] || REGION_STATE_MAP.default;
  const stateConfig = INDIA_STATES[stateKey];
  const cityConfig = CITY_COORDS[region] || CITY_COORDS.default;
  const regionName = REGION_NAMES[region] || REGION_NAMES.default;

  // Get all state keys for rendering (all states shown, one highlighted)
  const allStateKeys = Object.keys(INDIA_STATES) as (keyof typeof INDIA_STATES)[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ marginTop: 14 }}
    >
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--text-secondary)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Origin Region
      </div>

      <svg width={220} height={250} viewBox={INDIA_VIEWBOX} style={{ display: 'block' }}>
        {/* India outer boundary */}
        <path
          d={INDIA_OUTLINE}
          fill="rgba(0,0,0,0.03)"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1}
        />

        {/* All state paths (default styling) */}
        {allStateKeys.map((key) => (
          <path
            key={key}
            d={INDIA_STATES[key].path}
            fill="rgba(0,0,0,0.04)"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={0.8}
          />
        ))}

        {/* Highlighted state */}
        <motion.path
          d={stateConfig.path}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          fill="rgba(20,184,166,0.2)"
          stroke="rgba(20,184,166,0.7)"
          strokeWidth={1.5}
        />

        {/* Pulsing city dot with SVG animate */}
        <circle cx={cityConfig.x} cy={cityConfig.y} r={6} fill="var(--teal)" opacity={0.3}>
          <animate
            attributeName="r"
            values="3.5;6;3.5"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Static center dot */}
        <circle cx={cityConfig.x} cy={cityConfig.y} r={3.5} fill="var(--teal)" />

        {/* City label */}
        <text
          x={cityConfig.x}
          y={cityConfig.y + 14}
          fontSize={8}
          fontFamily="var(--font-mono)"
          fill="rgba(0,0,0,0.6)"
          textAnchor="middle"
        >
          {cityConfig.label}
        </text>

        {/* Region label at state center */}
        <text
          x={stateConfig.labelX}
          y={stateConfig.labelY}
          fontSize={7}
          fontFamily="var(--font-mono)"
          fill="rgba(20,184,166,0.9)"
          textAnchor="middle"
          fontWeight={600}
        >
          {regionName}
        </text>

        {/* Compass N↑ */}
        <text
          x={275}
          y={25}
          fontSize={10}
          fontFamily="var(--font-mono)"
          fill="rgba(0,0,0,0.3)"
          fontWeight={600}
        >
          N↑
        </text>
      </svg>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--teal)',
        marginTop: 6,
        letterSpacing: '0.04em',
      }}>
        ● {cityConfig.label} · {regionName}
      </div>
    </motion.div>
  );
}
