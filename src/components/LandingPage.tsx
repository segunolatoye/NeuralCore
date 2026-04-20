import React from 'react';
import { motion } from 'motion/react';
import { Brain, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { signIn, loading } = useAuth();

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/10 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 bg-slate-900/40 backdrop-blur-xl rounded-3xl glow-border border border-white/10"
          >
            <Brain size={64} className="text-white" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-light tracking-tight text-white uppercase sm:text-6xl">
              NEURAL<span className="font-bold text-indigo-400">CORE</span>
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide uppercase">
              The Cognitive Debit & Performance Engine
            </p>
          </div>
        </div>

        <div className="glass-card p-10 space-y-8 border-white/5">
          <p className="text-slate-300 leading-relaxed font-light italic">
            "Optimize your cognitive capacity through AI-driven neural analysis. Log patterns, detect debit, and master your learning modality."
          </p>

          <div className="space-y-4">
            <button
              onClick={signIn}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Initiate Secure Login
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-400" />
              Secured by Google Identity Protocol
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-12">
            {[ 
              { label: "Realtime", val: "ACTIVE" },
              { label: "AI Neural", val: "READY" },
              { label: "Temporal", val: "SYNCED" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">{stat.label}</span>
                <span className="text-xs font-mono text-indigo-400/80">{stat.val}</span>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
