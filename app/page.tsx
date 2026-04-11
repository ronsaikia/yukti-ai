'use client';

import { useState } from 'react';
import { Mic, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fdfbf7] text-[#2c3e50] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-6xl font-extralight tracking-tight">Yukti</h1>
        <p className="text-gray-400 font-light max-w-md mx-auto">
          Ensuring linguistic justice through unbiased phonetic auditing.
        </p>
      </motion.div>

      <div className="mt-20 relative flex items-center justify-center">
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-40 h-40 bg-teal-100 rounded-full"
          />
        )}
        <button 
          onClick={() => setIsRecording(!isRecording)}
          className="relative z-10 w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
        >
          <Mic className={`w-10 h-10 ${isRecording ? 'text-teal-600' : 'text-slate-400'}`} />
        </button>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-teal-600" />
          <span className="text-xs uppercase tracking-widest font-semibold">Bias Audit</span>
          <p className="text-center text-sm text-gray-400">Real-time correction for regional dialects.</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Globe className="w-6 h-6 text-teal-600" />
          <span className="text-xs uppercase tracking-widest font-semibold">SDG 10.3</span>
          <p className="text-center text-sm text-gray-400">Promoting inclusion across all origins.</p>
        </div>
      </div>
    </main>
  );
}