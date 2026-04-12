'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, Filter, Sparkles, ShieldCheck } from 'lucide-react';

const STAGES = [
  {
    id: 0,
    icon: Mic,
    label: 'Audio Capture',
    sublabel: 'WebM · 48kHz',
    color: 'text-slate-600',
    activeBg: 'bg-slate-100 border-slate-300',
    idleBg: 'bg-white border-slate-100',
    dotColor: 'bg-slate-400',
    activeDotColor: 'bg-slate-600',
    glowColor: 'shadow-slate-200',
  },
  {
    id: 1,
    icon: Brain,
    label: 'Vertex AI',
    sublabel: 'Chirp 3 · GCP',
    color: 'text-blue-600',
    activeBg: 'bg-blue-50 border-blue-200',
    idleBg: 'bg-white border-slate-100',
    dotColor: 'bg-blue-200',
    activeDotColor: 'bg-blue-500',
    glowColor: 'shadow-blue-100',
  },
  {
    id: 2,
    icon: Filter,
    label: 'Phonetic Layer',
    sublabel: 'Neutralizer · XAI',
    color: 'text-amber-600',
    activeBg: 'bg-amber-50 border-amber-200',
    idleBg: 'bg-white border-slate-100',
    dotColor: 'bg-amber-200',
    activeDotColor: 'bg-amber-500',
    glowColor: 'shadow-amber-100',
  },
  {
    id: 3,
    icon: Sparkles,
    label: 'Gemini API',
    sublabel: 'Contextual Repair',
    color: 'text-purple-600',
    activeBg: 'bg-purple-50 border-purple-200',
    idleBg: 'bg-white border-slate-100',
    dotColor: 'bg-purple-200',
    activeDotColor: 'bg-purple-500',
    glowColor: 'shadow-purple-100',
  },
  {
    id: 4,
    icon: ShieldCheck,
    label: 'Unbiased Result',
    sublabel: 'Equity Score · SDG 10',
    color: 'text-teal-600',
    activeBg: 'bg-teal-50 border-teal-200',
    idleBg: 'bg-white border-slate-100',
    dotColor: 'bg-teal-200',
    activeDotColor: 'bg-teal-500',
    glowColor: 'shadow-teal-100',
  },
];

const STAGE_DURATIONS = [500, 800, 700, 900, 600];

interface PipelineVisualizerProps {
  isProcessing: boolean;
  isComplete: boolean;
  currentStage: number;
}

export function PipelineVisualizer({ isProcessing, isComplete, currentStage }: PipelineVisualizerProps) {
  const boundedStage = Number.isFinite(currentStage)
    ? Math.max(0, Math.min(currentStage, STAGES.length - 1))
    : 0;

  const activeStage = isProcessing ? boundedStage : -1;
  const completedStages = isComplete
    ? STAGES.map((stage) => stage.id)
    : isProcessing
    ? STAGES.map((stage) => stage.id).filter((id) => id < boundedStage)
    : [];

  if (!isProcessing && !isComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* GCP Badge */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-white border border-slate-100 
                          rounded-full px-3 py-1 shadow-sm">
            <div className="flex gap-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Google Cloud Platform
            </span>
          </div>
        </div>

        {/* Pipeline */}
        <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <div className="relative flex items-center justify-between px-2 min-w-[560px] mx-auto">

          {/* Connector lines behind nodes */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center 
                          px-10 pointer-events-none" style={{ zIndex: 0 }}>
            {STAGES.slice(0, -1).map((_, i) => {
              const isConnectorActive =
                completedStages.includes(i) || activeStage > i;
              return (
                <div key={i} className="flex-1 relative h-0.5 mx-1">
                  <div className="absolute inset-0 bg-slate-100 rounded-full" />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r 
                               from-slate-300 to-teal-300"
                    initial={{ width: '0%' }}
                    animate={{ width: isConnectorActive ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                  {/* Moving dot on active connector */}
                  {activeStage === i + 1 && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 
                                 rounded-full bg-teal-500 shadow-sm"
                      initial={{ left: '0%' }}
                      animate={{ left: '100%' }}
                      transition={{
                        duration: STAGE_DURATIONS[i] / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage Nodes */}
          {STAGES.map((stage) => {
            const isActive = activeStage === stage.id;
            const isDone = completedStages.includes(stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className="relative flex flex-col items-center gap-1.5"
                style={{ zIndex: 1 }}
              >
                {/* Node circle */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.12 : isDone ? 1.05 : 1,
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(13,148,136,0.15), 0 4px 12px rgba(13,148,136,0.2)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    w-12 h-12 rounded-2xl border flex items-center justify-center
                    transition-colors duration-300
                    ${isActive
                      ? `${stage.activeBg} ${stage.glowColor}`
                      : isDone
                      ? `${stage.activeBg} opacity-80`
                      : stage.idleBg
                    }
                  `}
                >
                  {/* Pulse ring for active stage */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-teal-400"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}

                  {/* Checkmark overlay when done */}
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className={`w-5 h-5 ${stage.color}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 10l4.5 4.5L16 6" />
                      </svg>
                    </motion.div>
                  ) : (
                    <Icon
                      className={`w-5 h-5 transition-colors duration-300 ${
                        isActive ? stage.color : 'text-slate-300'
                      }`}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight transition-colors
                      ${isActive ? stage.color : isDone ? 'text-slate-500' : 'text-slate-300'}`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[9px] text-slate-300 text-center leading-tight mt-0.5">
                    {stage.sublabel}
                  </span>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`w-1 h-1 rounded-full ${stage.activeDotColor}`}
                  />
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Status text */}
        <div className="flex justify-center mt-5">
          <AnimatePresence mode="wait">
            {isProcessing && activeStage >= 0 && (
              <motion.div
                key={`stage-${activeStage}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-slate-200 border-t-teal-500 rounded-full"
                />
                <span className="text-xs text-slate-400 font-medium">
                  {activeStage === 0 && 'Capturing audio signal...'}
                  {activeStage === 1 && 'Vertex AI (Chirp 3) transcribing...'}
                  {activeStage === 2 && 'Phonetic neutralizer running...'}
                  {activeStage === 3 && 'Gemini applying contextual repair...'}
                  {activeStage === 4 && 'Generating fairness scorecard...'}
                </span>
              </motion.div>
            )}
            {isComplete && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-xs text-teal-600 font-semibold">
                  Audit complete · All stages verified
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
