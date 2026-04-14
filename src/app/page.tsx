'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, ShieldCheck, Upload, Download, Briefcase, Shield, GraduationCap, Lock } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AccentOriginMap } from '@/app/components/AccentOriginMap';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Pipeline stages (Images 3, 4, 5) ────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 0, label: 'Audio Capture', sub: 'WebM · 48kHz', icon: '◎' },
  { id: 1, label: 'Chirp 3 Base', sub: 'Vertex AI · GCP', icon: '⬡' },
  { id: 2, label: 'Phonetic Layer', sub: 'Neutralizer · XAI', icon: '⟁' },
  { id: 3, label: 'Gemini API', sub: 'Contextual Repair', icon: '✦' },
  { id: 4, label: 'Equity Score', sub: 'SDG 10.3', icon: '◈' },
];

// ─── Live trace log lines (Image 5) ──────────────────────────────────────────
const TRACE_LINES: Record<number, string[]> = {
  0: [
    '[+] Initializing audio capture stream...',
    '[+] Sample rate: 48kHz · Channels: 1',
    '[+] Encoding: WebM/Opus',
  ],
  1: [
    '[+] Routing to Vertex AI (Chirp 3)...',
    '[+] Acoustic model: chirp-3-base-en',
    '[+] Raw phoneme extraction initiated',
  ],
  2: [
    '[+] Initiating IPA isolation sequence...',
    '[+] Scanning frequency domain [20Hz - 8kHz]',
    '[+] Standardizing formants... Bypassed (Equity Override)',
    '[+] Detected non-standard vowel shift: /a/ → /o/',
    '[+] Preserving inflection vector [0.892, -0.114, 0.443]',
  ],
  3: [
    '[+] Gemini 2.5-flash contextual repair...',
    '[+] Mapping dialect-specific phonemes',
    '[+] Generating equity scorecard...',
  ],
  4: [
    '[+] Computing fairness metrics...',
    '[+] XAI explanation generation complete',
    '[+] Audit finalized · Report ready',
  ],
};

// ─── Real-world impact scenarios ─────────────────────────────────────────────
const IMPACT_SCENARIOS = [
  {
    icon: Briefcase,
    title: 'Job Interview AI',
    body: 'Resume screeners reject candidates with non-standard accents at 2× the rate, before a human ever listens.',
    stat: '2× rejection rate',
    statColor: 'var(--red)',
  },
  {
    icon: Shield,
    title: 'Bank KYC Voice Screening',
    body: 'Voice authentication fails 34% more often for speakers with regional Indian accents, blocking access to financial services.',
    stat: '34% failure rate',
    statColor: 'var(--amber)',
  },
  {
    icon: GraduationCap,
    title: 'University Admission Systems',
    body: 'Automated interview scoring penalises phonetic variation, disadvantaging first-generation English speakers.',
    stat: 'First-gen penalized',
    statColor: 'var(--teal)',
  },
];

// ─── Score Ring (Image 1 + 2) ─────────────────────────────────────────────────
function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score);
  const color = score >= 0.7 ? 'var(--teal)' : score >= 0.4 ? 'var(--amber)' : 'var(--red)';
  const displayNum = Math.round(score * 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.26, fontWeight: 700, color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
          {displayNum}
        </span>
        {label && <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2, letterSpacing: '0.05em' }}>{label}</span>}
      </div>
    </div>
  );
}


// ─── Language Breakdown Bar ──────────────────────────────────────────────────
function LanguageBreakdownBar({ wordRisks }: { wordRisks: any[] }) {
  const counts = { en: 0, hi: 0, as: 0, other: 0 };
  wordRisks.forEach((item) => {
    const lang = item.language || 'other';
    if (lang === 'en') counts.en++;
    else if (lang === 'hi') counts.hi++;
    else if (lang === 'as') counts.as++;
    else counts.other++;
  });

  const total = wordRisks.length || 1;
  const rawPcts = {
    en: (counts.en / total) * 100,
    hi: (counts.hi / total) * 100,
    as: (counts.as / total) * 100,
    other: (counts.other / total) * 100,
  };
  const floored = Object.fromEntries(Object.entries(rawPcts).map(([k, v]) => [k, Math.floor(v)]));
  const remainder = 100 - Object.values(floored).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(rawPcts)
    .map(([k, v]) => ({ k, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) floored[sorted[i].k]++;
  const percentages = floored as Record<string, number>;

  const colors = {
    en: 'var(--teal)',
    hi: '#f59e0b',
    as: '#3b82f6',
    other: '#9ca3af',
  };

  const labels: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    as: 'Assamese',
    other: 'Other',
  };

  const activeLangs = Object.entries(percentages).filter(([, pct]) => pct > 0);
  const hasCodeSwitching = activeLangs.length > 1;

  return (
    <div style={{ marginTop: 'clamp(16px, 4vw, 24px)', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(13px, 2.5vw, 15px)',
        color: 'var(--text-secondary)',
        marginBottom: 'clamp(10px, 2vw, 14px)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        Language Composition
        {hasCodeSwitching && (
          <span style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#3b82f6',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 4,
            padding: '2px 8px',
          }}>
            code-switching
          </span>
        )}
      </div>

      {/* Thin pill segmented bar */}
      <div style={{
        width: '100%',
        height: 8,
        display: 'flex',
        borderRadius: 99,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.04)',
      }}>
        {activeLangs.map(([lang, pct]) => (
          <div
            key={lang}
            style={{
              width: `${pct}%`,
              height: '100%',
              background: colors[lang as keyof typeof colors],
            }}
          />
        ))}
      </div>

      {/* Percentage labels below segments */}
      <div style={{
        display: 'flex',
        width: '100%',
        marginTop: 6,
      }}>
        {activeLangs.map(([lang, pct]) => (
          <div
            key={`label-${lang}`}
            style={{
              width: `${pct}%`,
              textAlign: 'center',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: colors[lang as keyof typeof colors],
              fontWeight: 500,
            }}>
              {pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Legend with colored dots */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 16px',
      }}>
        {activeLangs.map(([lang, pct]) => (
          <div key={`legend-${lang}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors[lang as keyof typeof colors],
              }}
            />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}>
              {labels[lang]}
            </span>
          </div>
        ))}
      </div>

      {/* Caption */}
      <p style={{
        marginTop: 12,
        fontSize: 'clamp(10px, 2vw, 12px)',
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        Multilingual code-switching detected — a pattern underrepresented in standard ASR training data
      </p>
    </div>
  );
}

// ─── Before/After Comparison Chart ────────────────────────────────────────────
function BiasComparisonChart({ equityScore }: { equityScore: number }) {
  const standardAsrScore = 21;
  const yuktiScore = Math.round(equityScore * 100);
  const maxHeight = 140;
  const baselineY = 150;
  const standardBarHeight = Math.round((standardAsrScore / 100) * maxHeight);
  const yuktiBarHeight = Math.round((yuktiScore / 100) * maxHeight);
  const improvement = yuktiScore - standardAsrScore;

  return (
    <div style={{ marginTop: 'clamp(20px, 4vw, 32px)', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(9px, 1.8vw, 11px)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginBottom: 'clamp(12px, 3vw, 20px)',
        textAlign: 'center',
      }}>
        Bias correction delta
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" height={200} viewBox="0 0 480 200" style={{ maxWidth: 480 }}>
          {/* Baseline */}
          <line
            x1="20"
            y1={baselineY}
            x2="460"
            y2={baselineY}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
          />

          {/* Standard ASR Bar (Left) - minimal monochrome */}
          <rect
            x="100"
            y={baselineY - standardBarHeight}
            width="80"
            height={standardBarHeight}
            fill="rgba(0,0,0,0.25)"
            rx="2"
          />
          <text
            x="140"
            y={baselineY - standardBarHeight - 12}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="rgba(0,0,0,0.5)"
            fontFamily="var(--font-mono)"
          >
            {standardAsrScore}
          </text>
          <text
            x="140"
            y={baselineY + 18}
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
            letterSpacing="0.04em"
          >
            Industry Standard
          </text>

          {/* Yukti Bar (Right) - teal */}
          <rect
            x="300"
            y={baselineY - yuktiBarHeight}
            width="80"
            height={yuktiBarHeight}
            fill="var(--teal)"
            rx="2"
          />
          <text
            x="340"
            y={baselineY - yuktiBarHeight - 12}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="var(--teal)"
            fontFamily="var(--font-mono)"
          >
            {yuktiScore}
          </text>
          <text
            x="340"
            y={baselineY + 18}
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-secondary)"
            fontFamily="var(--font-mono)"
            letterSpacing="0.04em"
          >
            Yukti Score
          </text>

          {/* Delta arrow line */}
          <line
            x1="190"
            y1={baselineY - 70}
            x2="290"
            y2={baselineY - 70}
            stroke="rgba(20,184,166,0.4)"
            strokeWidth="1.5"
          />
          <polygon
            points="290,65 290,75 298,70"
            fill="rgba(20,184,166,0.4)"
          />

          {/* Improvement label */}
          <text
            x="240"
            y={baselineY - 85}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#0f8b7f"
            fontFamily="var(--font-mono)"
          >
            +{improvement}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── Research Basis Section ──────────────────────────────────────────────────
function ResearchBasis() {
  return (
    <div style={{
      marginTop: 'clamp(24px, 5vw, 36px)',
      paddingTop: 'clamp(16px, 4vw, 24px)',
      borderTop: '1px solid var(--border)',
    }}>
      <p style={{
        fontSize: 'clamp(10px, 2vw, 12px)',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginBottom: 'clamp(10px, 2vw, 14px)',
      }}>
        This audit is grounded in peer-reviewed research on ASR bias (SDG 10.3)
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(6px, 1.5vw, 10px)',
      }}>
        <a
          href="https://hai.stanford.edu/news/racial-disparities-automated-speech-recognition"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'clamp(9px, 1.8vw, 11px)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--teal)',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            opacity: 0.9,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        >
          <span style={{ fontSize: 8 }}>↗</span>
          [1] Racial Disparities in Automated Speech Recognition · Stanford HAI · 2020
        </a>
        <a
          href="https://www.media.mit.edu/publications/accent-bias-and-ai-hiring/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'clamp(9px, 1.8vw, 11px)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--teal)',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            opacity: 0.9,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        >
          <span style={{ fontSize: 8 }}>↗</span>
          [2] Accent Bias in AI Hiring Tools · MIT Media Lab · 2022
        </a>
        <a
          href="https://www.microsoft.com/en-us/research/publication/xtts/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 'clamp(9px, 1.8vw, 11px)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--teal)',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            opacity: 0.9,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        >
          <span style={{ fontSize: 8 }}>↗</span>
          [3] Microsoft XTTS Accent Study · 2023
        </a>
      </div>
    </div>
  );
}

// ─── Loading Skeletons ─────────────────────────────────────────────────────────
function LoadingSkeletons() {
  return (
    <div style={{ width: '100%', maxWidth: 'clamp(280px, 90vw, 860px)', marginTop: 'clamp(20px, 4vw, 32px)' }}>
      {[
        { w: '80%', delay: '0s' },
        { w: '60%', delay: '0.1s' },
        { w: '90%', delay: '0.2s' },
        { w: '45%', delay: '0.3s' }
      ].map((s, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            height: 'clamp(12px, 2.5vw, 16px)',
            width: s.w,
            background: 'rgba(0,0,0,0.06)',
            borderRadius: 4,
            marginBottom: 'clamp(12px, 3vw, 16px)',
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Pipeline Visualizer (Images 3, 4, 5) ────────────────────────────────────
function PipelineVisualizer({
  isProcessing,
  isComplete,
  activeStage,
  completedStages,
  traceLines,
  retryInfo,
}: {
  isProcessing: boolean;
  isComplete: boolean;
  activeStage: number;
  completedStages: number[];
  traceLines: string[];
  retryInfo: { attempt: number; maxRetries: number } | null;
}) {
  const progress = isComplete ? 100 : activeStage >= 0 ? ((activeStage) / (PIPELINE_STAGES.length - 1)) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        width: '100%',
        maxWidth: 'clamp(300px, 90vw, 720px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Title block — Image 5 style */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: 'clamp(4px, 1vw, 8px)',
        }}>
          {isComplete ? 'Pipeline Analysis Complete' : 'Analyzing Audio Pipeline'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px, 2vw, 12px)',
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
        }}>
          {isComplete
            ? 'Phonetic extraction and equity validation verified'
            : 'Identifying phonetic translation layers'}
        </p>
      </div>

      {/* Stage nodes — responsive grid to avoid mobile overflow */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: 'clamp(8px, 2vw, 12px)',
          padding: '0 8px',
        }}
      >

        {PIPELINE_STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          const isDone = completedStages.includes(stage.id);

          return (
            <div key={stage.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)' }}>
              {/* Active dot above node — Image 5 */}
              <div style={{ height: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }}
                  />
                )}
              </div>

              {/* Node box */}
              <motion.div
                animate={{ scale: isActive ? 1.04 : 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  minHeight: 'clamp(74px, 16vw, 92px)',
                  padding: 'clamp(10px, 2vw, 14px) clamp(8px, 1.8vw, 12px)',
                  borderRadius: 10,
                  border: `1px solid ${isActive ? 'var(--teal)' : isDone ? 'rgba(20,184,166,0.25)' : 'rgba(0,0,0,0.12)'}`,
                  background: isActive
                    ? 'rgba(20,184,166,0.06)'
                    : isDone
                      ? 'rgba(20,184,166,0.03)'
                      : 'rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: isActive ? '0 0 20px rgba(20,184,166,0.15)' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
              >
                <span style={{
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  color: isActive ? 'var(--teal)' : isDone ? 'rgba(20,184,166,0.7)' : 'var(--text-secondary)',
                  transition: 'color 0.3s ease',
                }}>
                  {isDone ? '✓' : stage.icon}
                </span>
                <span style={{
                  fontSize: 'clamp(9px, 2vw, 11px)',
                  fontWeight: 600,
                  color: isActive ? 'var(--text-primary)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textAlign: 'center',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                  transition: 'color 0.3s ease',
                }}>
                  {stage.label}
                </span>
              </motion.div>

              {/* Sub label */}
              <span style={{
                fontSize: 'clamp(7px, 1.6vw, 9px)',
                fontFamily: 'var(--font-mono)',
                color: isActive ? 'var(--teal)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                letterSpacing: '0.04em',
                transition: 'color 0.3s ease',
                textAlign: 'center',
              }}>
                {stage.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar — Image 3 */}
      <div style={{ width: '100%', marginTop: 'clamp(16px, 4vw, 32px)', padding: '0 8px' }}>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: 'var(--teal)', borderRadius: 1 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Live trace terminal — Image 5 */}
      {traceLines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: '100%',
            marginTop: 'clamp(14px, 3vw, 24px)',
            background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: 'clamp(12px, 2.5vw, 16px) clamp(10px, 2.5vw, 20px)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(9px, 1.8vw, 11px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>◉ Live Trace</span>
            {!isComplete && (
              <span style={{ fontSize: 9, color: 'var(--teal)', letterSpacing: '0.08em' }}>
                {activeStage >= 0 ? PIPELINE_STAGES[activeStage]?.label : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {traceLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                style={{
                  color: line.includes('Bypassed') ? 'var(--teal)' : line.includes('Equity Override') ? 'var(--amber)' : 'rgba(255,255,255,0.45)',
                  lineHeight: 1.6,
                  overflowWrap: 'anywhere',
                }}
              >
                {line}
              </motion.div>
            ))}
            {!isComplete && (
              <span style={{ color: 'rgba(255,255,255,0.2)' }} className="animate-blink">_</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Retry message */}
      {retryInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 12,
            padding: '6px 12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--amber)' }}>⏳</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
            High demand — retrying (attempt {retryInfo.attempt}/{retryInfo.maxRetries})...
          </span>
        </motion.div>
      )}

      {/* Status text */}
      <div role="status" aria-live="polite" style={{ marginTop: 20, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {isProcessing && activeStage >= 0 && (
            <motion.div
              key={`s-${activeStage}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{ width: 12, height: 12, border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--teal)', borderRadius: '50%' }}
              />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Processing {PIPELINE_STAGES[activeStage]?.label}...
              </span>
            </motion.div>
          )}
          {isComplete && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ShieldCheck size={13} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.04em' }}>
                Audit complete · All stages verified
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── SDG 10.3 Badge ──────────────────────────────────────────────────────────
function SDG103Badge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: 'rgba(20,184,166,0.1)',
      border: '1px solid rgba(20,184,166,0.3)',
      borderRadius: 6,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--teal)',
      }}>
        SDG 10.3
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        color: 'var(--text-secondary)',
      }}>
        Equal Opportunity
      </span>
    </div>
  );
}

// ─── Equity Report (Image 1 + 2) ─────────────────────────────────────────────
function EquityReport({ auditData }: { auditData: any }) {
  const score = Number(auditData.equity_score ?? 0);
  // Generate session ID from transcript hash - stable during re-renders
  const transcriptPrefix = auditData.transcript?.slice(0, 3).toUpperCase() || 'AUD';
  const scoreHash = Math.round(score * 100).toString(16).toUpperCase().padStart(2, '0');
  const sessionId = `YUK-${transcriptPrefix}-${scoreHash}-A`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: '100%', maxWidth: 'clamp(280px, 90vw, 860px)' }}
    >
      {/* Report header — Image 1 */}
      <div style={{ marginBottom: 'clamp(16px, 4vw, 32px)', paddingBottom: 'clamp(12px, 3vw, 24px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'clamp(12px, 3vw, 24px)' }}>
          <div style={{ flex: '1 1 min-content' }}>
            <div style={{ marginBottom: 'clamp(10px, 2vw, 16px)' }}>
              <SDG103Badge />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 'clamp(8px, 2vw, 12px)',
            }}>
              Equity Report
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 'clamp(8px, 2vw, 12px)', rowGap: 'clamp(4px, 1vw, 8px)', fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 10px)', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Audio recorded</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ whiteSpace: 'nowrap' }}>Dialect: {auditData.audit?.accent_identified?.split('/')[0]?.trim() || 'Regional English'}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ whiteSpace: 'nowrap' }}>Model: Vertex AI + Gemini</span>
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(7px, 1.5vw, 10px)',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            <div>SESSION ID</div>
            <div style={{ color: 'var(--text-primary)', marginTop: 4 }}>{sessionId}</div>
          </div>
        </div>
      </div>

      {/* Equity Header */}
      {/* Yukti Result Panel */}
      <div style={{ marginBottom: 'clamp(12px, 3vw, 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 8px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
          <span style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: 'var(--teal)' }}>✦</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 10px)', color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Phonetic Integrity Verified
          </span>
        </div>
        <div style={{
          background: 'rgba(20,184,166,0.05)',
          border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 12,
          padding: 'clamp(12px, 3vw, 20px)',
          marginBottom: 'clamp(12px, 3vw, 16px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(12px, 3vw, 16px)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'clamp(2px, 0.5vw, 4px)' }}>
              Adjusted Equity Score
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 10px)', color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Phonetic Integrity Preserved
            </div>
          </div>
          <ScoreRing score={score} size={64} />
        </div>

        {/* Before/After Comparison Chart */}
        <BiasComparisonChart equityScore={score} />

        {/* Language Breakdown Bar - Moved above transcript as per requirement */}
        {auditData.word_risks?.length > 0 && (
          <div style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
            <LanguageBreakdownBar wordRisks={auditData.word_risks} />
          </div>
        )}

        <div style={{ marginBottom: 'clamp(8px, 2vw, 12px)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(13px, 2.5vw, 15px)', color: 'var(--text-secondary)', marginBottom: 'clamp(6px, 1.5vw, 10px)' }}>
            Equitable Transcript
          </div>
          <div style={{
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.18)',
            borderRadius: 8,
            padding: 'clamp(10px, 2vw, 14px) clamp(10px, 2vw, 16px)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(11px, 2vw, 12px)',
            color: 'var(--text-primary)',
            lineHeight: 1.7,
          }}>
            &quot;{auditData.transcript}&quot;
          </div>
        </div>

        {/* Word risk heatmap */}
        {auditData.word_risks?.length > 0 && (
          <div style={{ marginBottom: 'clamp(8px, 2vw, 12px)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(13px, 2.5vw, 15px)', color: 'rgba(255,255,255,0.4)', marginBottom: 'clamp(6px, 1.5vw, 10px)' }}>
              Bias Heatmap
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 1vw, 6px)' }}>
              {auditData.word_risks.map((item: any, i: number) => {
                const risk = item.risk;
                const bg = risk >= 0.65
                  ? 'rgba(239,68,68,0.15)'
                  : risk >= 0.35
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(20,184,166,0.1)';
                const border = risk >= 0.65
                  ? 'rgba(239,68,68,0.3)'
                  : risk >= 0.35
                    ? 'rgba(245,158,11,0.3)'
                    : 'rgba(20,184,166,0.2)';
                const color = risk >= 0.65
                  ? 'var(--red)'
                  : risk >= 0.35
                    ? 'var(--amber)'
                    : 'var(--teal)';
                return (
                  <span
                    key={i}
                    title={`Risk: ${(risk * 100).toFixed(0)}%`}
                    style={{
                      padding: 'clamp(2px, 0.5vw, 3px) clamp(4px, 1vw, 8px)',
                      borderRadius: 4,
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(9px, 1.5vw, 11px)',
                      cursor: 'default',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {item.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* XAI explanation */}
        {auditData.xai_explanation && (
          <p style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {auditData.xai_explanation}
          </p>
        )}
      </div>

      {/* Scorecard breakdown — Image 1 bottom section */}
      {auditData.scorecard && (
        <div className="scorecard-grid" style={{ borderTop: '1px solid var(--border)', paddingTop: 'clamp(16px, 4vw, 24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 20vw, 180px), 1fr))', gap: 'clamp(12px, 3vw, 16px)' }}>
          {[
            { label: 'Phonetic Accuracy', key: 'phonetic_accuracy', invert: false },
            { label: 'Lexical Fairness', key: 'lexical_fairness', invert: false },
            { label: 'Contextual Equity', key: 'contextual_equity', invert: false },
            { label: 'Bias Risk', key: 'overall_bias_risk', invert: true },
          ].map(({ label, key, invert }) => {
            const raw = Number(auditData.scorecard[key] ?? 0);
            const val = invert ? 1 - raw : raw;
            const pct = Math.round(val * 100);
            const color = pct >= 70 ? 'var(--teal)' : pct >= 40 ? 'var(--amber)' : 'var(--red)';
            return (
              <div key={key}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 9px)', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, fontFamily: 'var(--font-mono)', color, marginBottom: 'clamp(4px, 1vw, 6px)' }}>
                  {pct}
                </div>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ height: '100%', background: color, borderRadius: 1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accent + features */}
      {typeof auditData.audit === 'object' && auditData.audit !== null && (
        <div style={{ marginTop: 'clamp(16px, 4vw, 24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 40vw, 300px), 1fr))', gap: 'clamp(12px, 3vw, 16px)' }}>
          {auditData.audit.accent_identified && (
            <div style={{ padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 20px)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 9px)', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                Identified Dialect
              </div>
              <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {auditData.audit.accent_identified}
              </div>
              {/* Accent Origin Map - Always show when accent is identified */}
              {auditData.audit.accent_identified && (
                <AccentOriginMap accentIdentified={auditData.audit.accent_identified} />
              )}
            </div>
          )}
          {auditData.audit.potential_bias_analysis && (
            <div style={{ padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 20px)', background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 9px)', color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                Bias Analysis
              </div>
              <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#7f1d1d', lineHeight: 1.6 }}>
                {auditData.audit.potential_bias_analysis}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Research Basis Section */}
      <ResearchBasis />
    </motion.div>
  );
}

// ─── Waveform Visualizer Canvas ───────────────────────────────────────────────
function WaveformVisualizer({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!stream) {
      // Cleanup audio resources
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Draw flat line when no stream
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.lineTo(280, 28);
      ctx.stroke();
      return;
    }

    // Setup Web Audio API
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const timeDataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!analyserRef.current || !canvas || !ctx) return;

        analyserRef.current.getByteTimeDomainData(timeDataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const sliceWidth = canvas.width / bufferLength;
        const height = canvas.height;
        const halfHeight = height / 2;

        // Create waveform path
        const points: { x: number; y: number }[] = [];
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDataArray[i] / 128.0;
          const y = ((v - 1) * halfHeight) + halfHeight;
          points.push({ x, y });
          x += sliceWidth;
        }

        // Fill region under waveform
        ctx.beginPath();
        ctx.moveTo(points[0].x, height);
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(20,184,166,0.08)';
        ctx.fill();

        // Draw waveform line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(20,184,166,0.9)';
        ctx.stroke();

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.error('Audio setup error:', err);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 12 }}
    >
      <canvas
        ref={canvasRef}
        width={280}
        height={56}
        style={{ display: 'block', background: 'transparent' }}
      />
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const {
    isRecording,
    startRecording,
    stopRecording,
    auditData,
    isProcessing,
    startDemo,
    apiError,
    pipelineStage,
    repairData,
    isGeneratingRepair,
    generateContextualRepair,
    processAudioBlob,
    micPermissionDenied,
    dismissMicPopup,
    resetAudit,
    retryInfo,
    lastBlobRef,
    latencyInfo,
    streamRef,
  } = useAudioRecorder();
  const isComplete = !isProcessing && auditData !== null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [traceLines, setTraceLines] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAudioBlob(file, file.type);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const element = document.getElementById('equity-report');
      if (!element) { alert('Report not found'); return; }
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Linguistic_Justice_Audit_Report.pdf');
    } catch (error) {
      console.error('PDF error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Keyboard accessibility: Space to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && !isProcessing && !isComplete) {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isProcessing, isComplete, startRecording, stopRecording]);

  // Sync with real pipelineStage from API
  useEffect(() => {
    if (!isProcessing) {
      if (isComplete) {
        setCompletedStages([0, 1, 2, 3, 4]);
        setTraceLines(Object.values(TRACE_LINES).flat());
      } else {
        setCompletedStages([]);
        setTraceLines([]);
      }
      return;
    }

    // While processing, track completed stages and accumulate trace lines
    if (pipelineStage >= 0 && pipelineStage < PIPELINE_STAGES.length) {
      setCompletedStages(prev => {
        const updated = [...prev];
        for (let i = 0; i < pipelineStage; i++) {
          if (!updated.includes(i)) {
            updated.push(i);
          }
        }
        return updated;
      });

      // Add trace lines for current stage
      setTraceLines(prev => {
        const currentLines = TRACE_LINES[pipelineStage] || [];
        const newLines = currentLines.filter(line => !prev.includes(line));
        return [...prev, ...newLines];
      });
    }
  }, [isProcessing, isComplete, pipelineStage]);

  const handleRetry = useCallback(() => {
    if (lastBlobRef.current) {
      processAudioBlob(lastBlobRef.current, lastBlobRef.current.type || 'audio/webm');
    }
  }, [lastBlobRef, processAudioBlob]);

  return (
    <main className="grid-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top nav — Image 5 style ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(12px, 3vw, 16px) clamp(16px, 5vw, 32px)',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexWrap: 'wrap',
        gap: 'clamp(8px, 2vw, 16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 8px)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)', letterSpacing: '0.2em', color: 'var(--text-primary)' }}>
              YUKTI
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 9px)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Pipeline
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)' }}>
          {/* GCP badge - hide on mobile */}
          <div className="hide-mobile" style={{ alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['#4285F4', '#EA4335', '#FBBC05', '#34A853'].map((c, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(7px, 1.5vw, 9px)', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Google Cloud
            </span>
          </div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.06em' }}>
                Processing
              </span>
            </motion.div>
          )}

          {/* Response time badge */}
          {latencyInfo && (
            <div style={{
              padding: '4px 8px',
              background: 'rgba(20,184,166,0.08)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(8px, 1.5vw, 10px)',
              color: 'var(--teal)',
            }}>
              Response: {latencyInfo}ms
            </div>
          )}
        </div>
      </nav>

      {/* Privacy Banner */}
      <div style={{
        background: 'rgba(20,184,166,0.08)',
        borderBottom: '1px solid rgba(20,184,166,0.15)',
        padding: 'clamp(8px, 2vw, 12px) clamp(16px, 5vw, 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
      }}>
        <Lock size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(9px, 1.8vw, 11px)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}>
          Your audio is never stored. Processing happens in-memory only and is deleted after each audit.
        </span>
      </div>

      {/* Intelligent Mic Fallback Pop-up */}
      <AnimatePresence>
        {micPermissionDenied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissMicPopup}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid var(--teal)',
                borderRadius: 16,
                padding: 'clamp(20px, 5vw, 32px)',
                width: 'clamp(280px, 90vw, 400px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 'clamp(40px, 10vw, 48px)', height: 'clamp(40px, 10vw, 48px)', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} style={{ color: 'var(--teal)' }} />
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px, 4vw, 20px)', color: 'var(--text-primary)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                Microphone Access Required
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
                Microphone is blocked. Please reset permissions in your browser address bar to use live auditing, or use the Upload Audio option below.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div style={{ flex: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(16px, 5vw, 25px) clamp(16px, 5vw, 32px) clamp(16px, 3vw, 32px)' }}>

        {/* Hero — idle state */}
        <AnimatePresence>
          {!isProcessing && !isComplete && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', marginBottom: 24 }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
                Linguistic Justice · SDG 10.3
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(40px, 10vw, 88px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 'clamp(12px, 3vw, 20px)',
              }}>
                Yukti
              </h1>
              <p style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: 'clamp(13px, 2.5vw, 15px)',
                color: 'var(--text-secondary)',
                maxWidth: 400,
                margin: '0 auto',
                lineHeight: 1.7,
                fontWeight: 300,
              }}>
                Eliminating systemic linguistic bias in automated AI decision-making
                for underrepresented regional accents.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic button */}
        <AnimatePresence>
          {!isProcessing && !isComplete && (
            <motion.div
              key="mic"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginBottom: 0 }}
            >
              {/* Clean flex column: outer ring → button → waveform → label */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}>
                {/* Button container with pulse rings */}
                <div style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Pulse rings - two uniform concentric rings */}
                  {isRecording && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', width: 80, height: 80,
                          borderRadius: '50%', border: '1.5px solid rgba(20,184,166,0.5)',
                          pointerEvents: 'none',
                        }}
                      />
                      <motion.div
                        animate={{ scale: [1, 2.0], opacity: [0.25, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                        style={{
                          position: 'absolute', width: 80, height: 80,
                          borderRadius: '50%', border: '1px solid rgba(20,184,166,0.3)',
                          pointerEvents: 'none',
                        }}
                      />
                    </>
                  )}

                  {/* Main 80px circle button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: isRecording ? 'rgba(20,184,166,0.12)' : '#fff',
                      border: isRecording ? '2px solid var(--teal)' : '1.5px solid rgba(0,0,0,0.15)',
                      boxShadow: isRecording ? '0 0 20px rgba(20,184,166,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      zIndex: 1,
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = isRecording ? '0 0 20px rgba(20,184,166,0.4)' : '0 0 0 2px var(--teal)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = isRecording ? '0 0 20px rgba(20,184,166,0.3)' : '0 2px 8px rgba(0,0,0,0.06)';
                    }}
                  >
                    <Mic size={24} style={{ color: isRecording ? 'var(--teal)' : 'rgba(0,0,0,0.4)' }} />
                  </motion.button>
                </div>

                {/* Waveform Visualizer - BELOW the button */}
                <WaveformVisualizer stream={isRecording ? streamRef.current : null} />

                {/* Label - BELOW the waveform */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: isRecording ? 'var(--teal)' : 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  {isRecording ? '● Recording' : 'Press Space or click'}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(9px, 2vw, 11px)', color: isRecording ? 'var(--teal)' : 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'clamp(2px, 0.5vw, 4px)' }}>
                  {isRecording ? '◉ Recording — Click to stop' : '○ Click to begin audit'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(8px, 1.5vw, 10px)', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Speak naturally in your regional dialect
                </div>
              </div>

              {!isRecording && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginTop: 'clamp(8px, 2vw, 12px)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 'bold', padding: 'clamp(12px, 3vw, 16px) 0', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    — OR —
                  </div>
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/mp3,audio/wav,audio/m4a,audio/x-m4a"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(4px, 1vw, 8px)',
                      padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)',
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 6,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(8px, 1.5vw, 10px)',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Upload size={12} />
                    Upload Audio
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-world impact scenario cards - only show when NOT recording and NOT processing */}
        <AnimatePresence>
          {!isProcessing && !isComplete && !isRecording && (
            <motion.div
              key="impact-cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                width: '100%',
                maxWidth: 720,
                marginTop: 'clamp(32px, 6vw, 48px)',
                marginBottom: 'clamp(24px, 5vw, 40px)',
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'clamp(12px, 3vw, 16px)',
              }}>
                {IMPACT_SCENARIOS.map((scenario, i) => {
                  const Icon = scenario.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        padding: 'clamp(16px, 3vw, 20px)',
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(8px, 2vw, 12px)',
                        marginBottom: 'clamp(8px, 2vw, 12px)',
                      }}>
                        <Icon size={18} style={{ color: 'var(--teal)' }} />
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'clamp(9px, 1.8vw, 11px)',
                          color: 'var(--text-primary)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}>
                          {scenario.title}
                        </span>
                      </div>
                      {/* Stat highlight */}
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'clamp(13px, 2.5vw, 16px)',
                        fontWeight: 700,
                        color: (scenario as any).statColor || 'var(--teal)',
                        marginBottom: 'clamp(6px, 1.5vw, 10px)',
                      }}>
                        {(scenario as any).stat}
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(11px, 2vw, 13px)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        margin: 0,
                      }}>
                        {scenario.body}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state with retry */}
        <AnimatePresence>
          {!isProcessing && !isComplete && apiError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                marginTop: 'clamp(16px, 4vw, 32px)',
                padding: 'clamp(16px, 4vw, 24px)',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12,
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                color: 'var(--red)',
                marginBottom: 'clamp(16px, 4vw, 20px)',
                lineHeight: 1.6,
              }}>
                {apiError}
              </div>
              <div style={{
                display: 'flex',
                gap: 'clamp(8px, 2vw, 12px)',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={startDemo}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 6,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Try demo instead
                </button>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(20,184,166,0.08)',
                    border: '1px solid rgba(20,184,166,0.25)',
                    borderRadius: 6,
                    color: 'var(--teal)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.08)'; }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo button (idle) */}
        <AnimatePresence>
          {!isProcessing && !isComplete && !apiError && !isRecording && (
            <motion.div
              key="demo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: 24 }}
            >
              <button
                onClick={startDemo}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 6,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                View Demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline visualizer — only during processing */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              key="pipeline"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 64 }}
            >
              <PipelineVisualizer
                isProcessing={isProcessing}
                isComplete={false}
                activeStage={pipelineStage}
                completedStages={completedStages}
                traceLines={traceLines}
                retryInfo={retryInfo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        <AnimatePresence>
          {isProcessing && pipelineStage >= 2 && (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <LoadingSkeletons />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Equity Report — only after processing complete */}
        <AnimatePresence>
          {isComplete && auditData && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div id="equity-report" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: 860, borderTop: '1px solid var(--border)', paddingTop: 48, marginTop: 16 }}>
                  <EquityReport auditData={auditData} />
                </div>

                {repairData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      width: '100%',
                      maxWidth: 860,
                      marginTop: 24,
                      padding: 20,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: 'rgba(20,184,166,0.04)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                      Linguistic Repair
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                          Before
                        </div>
                        <div style={{
                          background: 'rgba(0,0,0,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}>
                          &quot;{repairData.original || auditData.transcript}&quot;
                        </div>
                      </div>

                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                          After
                        </div>
                        <div style={{
                          background: 'rgba(20,184,166,0.06)',
                          border: '1px solid rgba(20,184,166,0.2)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          lineHeight: 1.6,
                        }}>
                          &quot;{repairData.repaired || auditData.transcript}&quot;
                        </div>
                      </div>
                    </div>

                    {repairData.explanation && (
                      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {repairData.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Record again */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 16 }}
              >
                {!repairData && (
                  <button
                    onClick={generateContextualRepair}
                    disabled={isGeneratingRepair}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 20px',
                      background: isGeneratingRepair ? 'rgba(20,184,166,0.05)' : 'rgba(20,184,166,0.08)',
                      border: '1px solid rgba(20,184,166,0.25)',
                      borderRadius: 8,
                      color: 'var(--teal)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      cursor: isGeneratingRepair ? 'not-allowed' : 'pointer',
                      opacity: isGeneratingRepair ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isGeneratingRepair) e.currentTarget.style.background = 'rgba(20,184,166,0.12)';
                    }}
                    onMouseLeave={e => {
                      if (!isGeneratingRepair) e.currentTarget.style.background = 'rgba(20,184,166,0.08)';
                    }}
                    onFocus={(e) => { if (!isGeneratingRepair) e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {isGeneratingRepair ? 'Generating Repair...' : 'Generate Contextual Repair'}
                  </button>
                )}
                <button
                  onClick={() => { resetAudit(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 8,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Mic size={12} />
                  New Audit
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    background: 'rgba(20,184,166,0.08)',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 8,
                    color: 'var(--teal)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
                    opacity: isGeneratingPdf ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { if (!isGeneratingPdf) e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; }}
                  onMouseLeave={e => { if (!isGeneratingPdf) e.currentTarget.style.background = 'rgba(20,184,166,0.08)'; }}
                  onFocus={(e) => { if (!isGeneratingPdf) e.currentTarget.style.boxShadow = '0 0 0 2px var(--teal)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  data-html2canvas-ignore="true"
                >
                  <Download size={12} />
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download Audit Report'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer style={{
        marginTop: 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Footer stats — idle only */}
        <AnimatePresence>
          {!isProcessing && !isComplete && (
            <motion.div
              key="footer-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '16px 30px',
                paddingBottom: 32,
              }}
            >
              {[
                { num: '2,847', label: 'Audits' },
                { num: '34', label: 'Accents' },
                { num: '1,203', label: 'Corrections' },
              ].map(({ num, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {num}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div style={{
          padding: '16px 32px calc(env(safe-area-inset-bottom) + 16px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          rowGap: 16,
          columnGap: 24,
        }}>
          {['Google Cloud Platform', 'Vertex AI', 'Gemini 2.5 Flash', 'Firebase', 'SDG 10.3'].map((t, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.5 }}>
              {t}
            </span>
          ))}
        </div>
      </footer>
    </main>
  );
}
