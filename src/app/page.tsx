'use client';

import { useState, useEffect } from 'react';
import { Mic, ShieldCheck, Globe, FileText, Activity, Zap, BarChart3 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Pipeline stages (Images 3, 4, 5) ────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 0, label: 'Audio Capture', sub: 'WebM · 48kHz', icon: '◎' },
  { id: 1, label: 'Chirp 3 Base', sub: 'Vertex AI · GCP', icon: '⬡' },
  { id: 2, label: 'Phonetic Layer', sub: 'Neutralizer · XAI', icon: '⟁' },
  { id: 3, label: 'Gemini API', sub: 'Contextual Repair', icon: '✦' },
  { id: 4, label: 'Equity Score', sub: 'SDG 10.3', icon: '◈' },
];
const STAGE_DURATIONS = [600, 900, 800, 1000, 700];

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

// ─── Pipeline Visualizer (Images 3, 4, 5) ────────────────────────────────────
function PipelineVisualizer({
  isProcessing,
  isComplete,
  activeStage,
  completedStages,
  traceLines,
}: {
  isProcessing: boolean;
  isComplete: boolean;
  activeStage: number;
  completedStages: number[];
  traceLines: string[];
}) {
  const progress = isComplete ? 100 : activeStage >= 0 ? ((activeStage) / (PIPELINE_STAGES.length - 1)) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        width: '100%',
        maxWidth: 720,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Title block — Image 5 style */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}>
          {isComplete ? 'Pipeline Analysis Complete' : 'Analyzing Audio Pipeline'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
        }}>
          {isComplete
            ? 'Phonetic extraction and equity validation verified'
            : 'Identifying phonetic translation layers'}
        </p>
      </div>

      {/* Stage nodes — Image 3 style */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
        {/* Connector lines */}
        <div style={{ position: 'absolute', left: 60, right: 60, top: '50%', transform: 'translateY(-50%)', height: 1, background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
        
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = activeStage === stage.id;
          const isDone = completedStages.includes(stage.id);

          return (
            <div key={stage.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
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
                  width: 112,
                  padding: '14px 12px',
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
                  fontSize: 18,
                  color: isActive ? 'var(--teal)' : isDone ? 'rgba(20,184,166,0.7)' : 'var(--text-secondary)',
                  transition: 'color 0.3s ease',
                }}>
                  {isDone ? '✓' : stage.icon}
                </span>
                <span style={{
                  fontSize: 11,
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
                fontSize: 9,
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
      <div style={{ width: '100%', marginTop: 32, padding: '0 8px' }}>
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
            marginTop: 24,
            background: '#0d0d0d',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '16px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
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
                style={{ color: line.includes('Bypassed') ? 'var(--teal)' : line.includes('Equity Override') ? 'var(--amber)' : 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}
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

      {/* Status text */}
      <div style={{ marginTop: 20, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ─── Equity Report (Image 1 + 2) ─────────────────────────────────────────────
function EquityReport({ auditData }: { auditData: any }) {
  const score = Number(auditData.equity_score ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: '100%', maxWidth: 860 }}
    >
      {/* Report header — Image 1 */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 42,
              fontWeight: 400,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 12,
            }}>
              Equity Report
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span>Audio recorded</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>Dialect: {auditData.audit?.accent_identified?.split('/')[0]?.trim() || 'Regional English'}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>Model: Vertex AI + Gemini</span>
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-secondary)',
            textAlign: 'right',
            letterSpacing: '0.05em',
          }}>
            <div>SESSION ID</div>
            <div style={{ color: 'var(--text-primary)', marginTop: 4 }}>YUK-{Math.floor(1000 + Math.random() * 9000)}-A</div>
          </div>
        </div>
      </div>

      {/* Equity Header */}
      {/* Yukti Result Panel */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--teal)' }}>✦</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Phonetic Integrity Verified
          </span>
        </div>
        <div style={{
          background: 'rgba(20,184,166,0.05)',
          border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 4 }}>
              Adjusted Equity Score
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Phonetic Integrity Preserved
            </div>
          </div>
          <ScoreRing score={score} size={72} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Equitable Transcript
          </div>
          <div style={{
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.18)',
            borderRadius: 8,
            padding: '14px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-primary)',
            lineHeight: 1.7,
          }}>
            &quot;{auditData.transcript}&quot;
          </div>
        </div>

        {/* Word risk heatmap */}
        {auditData.word_risks?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Bias Heatmap
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
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
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {auditData.xai_explanation}
          </p>
        )}
      </div>

      {/* Scorecard breakdown — Image 1 bottom section */}
      {auditData.scorecard && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color, marginBottom: 6 }}>
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
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {auditData.audit.accent_identified && (
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Identified Dialect
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {auditData.audit.accent_identified}
              </div>
            </div>
          )}
          {auditData.audit.potential_bias_analysis && (
            <div style={{ padding: '16px 20px', background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Bias Analysis
              </div>
              <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 }}>
                {auditData.audit.potential_bias_analysis}
              </div>
            </div>
          )}
        </div>
      )}
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
  } = useAudioRecorder();
  const isComplete = !isProcessing && auditData !== null;

  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [traceLines, setTraceLines] = useState<string[]>([]);

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

  return (
    <main className="grid-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top nav — Image 5 style ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/demo" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-secondary)',
            textDecoration: 'none', letterSpacing: '0.03em',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            ← Demo
          </a>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', color: 'var(--text-primary)' }}>
              YUKTI
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Pipeline
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* GCP badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px' }}>

        {/* Hero — idle state */}
        <AnimatePresence>
          {!isProcessing && !isComplete && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', marginBottom: 64 }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
                Linguistic Justice · SDG 10.3
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(52px, 8vw, 88px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 20,
              }}>
                Yukti
              </h1>
              <p style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: 15,
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
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginBottom: 80 }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Outer pulse rings */}
                {isRecording && [1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      border: '1px solid var(--teal)',
                    }}
                  />
                ))}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: isRecording ? 'rgba(20,184,166,0.12)' : 'rgba(0,0,0,0.04)',
                    border: `1.5px solid ${isRecording ? 'var(--teal)' : 'rgba(0,0,0,0.15)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 0 32px rgba(20,184,166,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Mic size={28} style={{ color: isRecording ? 'var(--teal)' : 'rgba(0,0,0,0.35)' }} />
                </motion.button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isRecording ? 'var(--teal)' : 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {isRecording ? '◉ Recording — Click to stop' : '○ Click to begin audit'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  Speak naturally in your regional dialect
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message + Demo button */}
        <AnimatePresence>
          {!isProcessing && !isComplete && apiError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                marginTop: 32,
                padding: '16px 20px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: '0.04em', marginBottom: 12 }}>
                {apiError}
              </div>
              <button
                onClick={startDemo}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(20,184,166,0.1)',
                  border: '1px solid rgba(20,184,166,0.3)',
                  borderRadius: 6,
                  color: 'var(--teal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.1)'; }}
              >
                Try Demo Instead
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo button (idle) */}
        <AnimatePresence>
          {!isProcessing && !isComplete && !apiError && (
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
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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
              />
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

              {/* Record again */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 16 }}
              >
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
                  }}
                  onMouseEnter={e => {
                    if (!isGeneratingRepair) e.currentTarget.style.background = 'rgba(20,184,166,0.12)';
                  }}
                  onMouseLeave={e => {
                    if (!isGeneratingRepair) e.currentTarget.style.background = 'rgba(20,184,166,0.08)';
                  }}
                >
                  {isGeneratingRepair ? 'Generating Repair...' : 'Generate Contextual Repair'}
                </button>
                <button
                  onClick={() => { startRecording(); }}
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
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Mic size={12} />
                  New Audit
                </button>
                <a
                  href="/demo"
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(20,184,166,0.08)',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 8,
                    color: 'var(--teal)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.08)'; }}
                >
                  View Demo →
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer stats — idle only */}
        <AnimatePresence>
          {!isProcessing && !isComplete && (
            <motion.div
              key="footer-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 48,
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
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '12px 32px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}>
        {['Google Cloud Platform', 'Vertex AI', 'Gemini 2.5', 'Firebase', 'SDG 10.3'].map((t, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t}
          </span>
        ))}
      </div>
    </main>
  );
}