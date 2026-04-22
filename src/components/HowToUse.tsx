import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  History, 
  Bell,
  Clock,
  LineChart
} from 'lucide-react';

export const HowToUse: React.FC = () => {
  const steps = [
    {
      title: "Initialize Data Point",
      description: "Click 'Log Session' to record your learning. Enter the subject, duration, and how you felt. Don't worry about being perfect—your honest feeling is the best data.",
      icon: <History className="text-indigo-400" size={24} />,
      detail: "Fields like 'Flow State' track if you lost track of time, which significantly lowers brain fatigue."
    },
    {
      title: "Neural Analysis",
      description: "NeuralCore AI calculates your 'Cognitive Debit'—a status of how tired your brain actually is versus how much you've learned.",
      icon: <Brain className="text-brand-accent" size={24} />,
      detail: "A score over 70 DBT indicates 'Neural Redlining'—you're working hard but retaining very little."
    },
    {
      title: "Neural Triggers",
      description: "Schedule future work in the Trigger Manager. You can now modify these 'Triggers' at any time by clicking the Edit icon—no need to delete and recreate.",
      icon: <Bell className="text-orange-400" size={24} />,
      detail: "Adaptive scheduling: Unlike static calendars, triggers are designed to be fluidly moved based on your current Cognitive Debit levels."
    },
    {
      title: "Neural Persistence",
      description: "Your data is now globally synchronized. Sign in from any device to access your 'Neural Identity', cognitive records, and behavioral insights instantly.",
      icon: <ShieldCheck className="text-emerald-400" size={24} />,
      detail: "Secure cross-session storage ensures that your AI-generated 'Brain Debt' analysis remains accurate and historical records are never lost."
    },
    {
      title: "Snooze Protocol",
      description: "When a trigger activates, you can 'Initiate Session' or 'Snooze 15m'. Snoozing intelligently recalibrates the trigger point in the cloud.",
      icon: <Clock className="text-indigo-400" size={24} />,
      detail: "Snoozing is preferred over dismissing when biological levels temporarily dip, allowing for a short recovery period before neural activation."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <header className="text-center space-y-4">
        <div className="inline-flex p-3 bg-brand-accent/10 rounded-2xl text-brand-accent glow-border mb-4">
          <BookOpen size={32} />
        </div>
        <h1 className="text-4xl font-light tracking-tight text-white uppercase">
          Operating <span className="font-bold text-indigo-400">Manual</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          NeuralCore v2.1 is designed to optimize your biological learning hardware. 
          Follow these protocols to maximize retention.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {steps.map((step, index) => (
          <div key={index} className="glass-card p-4 md:p-6 relative overflow-hidden group hover:bg-white/10 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {step.icon}
             </div>
             <div className="flex items-center gap-4 mb-4">
               <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs font-mono text-slate-500">
                 0{index + 1}
               </div>
               <h3 className="text-lg font-bold text-white uppercase tracking-tight">{step.title}</h3>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed mb-4">
               {step.description}
             </p>
             <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
                  <ShieldCheck size={12} /> Tech Spec
                </p>
                <p className="text-[11px] text-slate-500 italic leading-snug">
                  {step.detail}
                </p>
             </div>
          </div>
        ))}
      </section>

      <section className="glass-card p-4 md:p-8 bg-indigo-950/20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-light text-white uppercase">Understanding <span className="font-bold text-emerald-400">Cognitive Debit</span></h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Think of your brain like a battery that doesn't just empty—it creates "internal resistance" as it heats up. 
              <strong> Cognitive Debit (DBT)</strong> measures that resistance. 
              High scores mean you’re burning more energy for fewer results.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] text-slate-300 uppercase font-mono">0-40: Prime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                <span className="text-[10px] text-slate-300 uppercase font-mono">41-70: Strained</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="text-[10px] text-slate-300 uppercase font-mono">71+: Redline</span>
              </div>
            </div>
          </div>
          <div className="w-48 h-48 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 relative">
             <LineChart className="text-emerald-400/30" size={80} />
             <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-emerald-400">88%</span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Retention Opt.</span>
             </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-4 md:p-8 bg-slate-900/40">
        <div className="space-y-4">
          <h3 className="text-2xl font-light text-white uppercase">System <span className="font-bold text-indigo-400">Navigation</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold text-white uppercase">Flexible Interface</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                On desktop, use the floating toggle at the bottom-right of the sidebar to collapse the navigation rail. 
                This maximizes your visualization area while keeping mission-critical icons accessible.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-white uppercase">Neural Identity Sync</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your neural profile, preferences, and performance history are now automatically encrypted and synced to the cloud. 
                Logging in from any terminal restores your full neural state and active session logs instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center p-6 space-y-6">
        <div className="space-y-4">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-mono">
            Ready to optimize your neural hardware?
          </p>
          <button 
            onClick={() => window.location.hash = '#dashboard'}
            className="bg-white/5 hover:bg-white/10 text-brand-accent px-8 py-3 rounded-full border border-white/10 transition-all flex items-center gap-2 mx-auto uppercase text-xs font-bold tracking-widest"
          >
            Return to Command Center <ArrowRight size={14} />
          </button>
        </div>

        <div className="pt-8 border-t border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono leading-relaxed max-w-lg mx-auto">
            This platform is based on a school project by <span className="text-indigo-400 font-bold">Suliyat Folorunsho</span>, 
            developed as a requirement for the completion of a <span className="text-white">BSc in Computer Science</span>.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};
