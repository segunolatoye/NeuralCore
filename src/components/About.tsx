import React from 'react';
import { motion } from 'motion/react';
import { Info, User, GraduationCap, FileText, BadgeCheck } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <header className="text-center space-y-4">
        <div className="inline-flex p-3 bg-brand-accent/10 rounded-2xl text-brand-accent glow-border mb-4">
          <Info size={32} />
        </div>
        <h1 className="text-4xl font-light tracking-tight text-white uppercase">
          Neural Core <span className="font-bold text-indigo-400">About</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Project documentation and academic accreditation.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Profile Card */}
        <div className="glass-card p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User size={120} />
          </div>
          
          <div className="space-y-2">
            <span className="tech-label text-indigo-400">Lead Researcher</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">OLAITAN SULIYAT FOLORUNSO</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <GraduationCap className="text-slate-500" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Identification</p>
                <p className="text-sm text-slate-200 font-mono">FTP/CSC/25/0118199</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <BadgeCheck className="text-indigo-400" size={18} />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Academic Status</p>
                <p className="text-sm text-slate-200">BSc Computer Science Candidate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Thesis Card */}
        <div className="glass-card p-8 space-y-6 relative overflow-hidden border-l-4 border-l-brand-accent">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileText size={120} />
          </div>

          <div className="space-y-2">
            <span className="tech-label text-brand-accent">Project Thesis</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight italic">
              AI-DRIVEN MODEL FOR COGNITIVE DEBIT IN LEARNING PERFORMANCE
            </h2>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">
            This platform serves as the experimental implementation of the research topic. 
            It leverages the Gemini Neural Engine to quantify mental fatigue (Cognitive Debit) 
            through multi-modal data point analysis in real-time.
          </p>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-mono italic">
              Submission: Final Year Project Requirement &bull; BSc Computer Science
            </p>
          </div>
        </div>
      </div>

      {/* System Architecture Section */}
      <section className="glass-card p-8 bg-slate-900/40 space-y-6">
        <h3 className="text-xl font-light text-white uppercase">NeuralCore <span className="font-bold text-indigo-400">Architecture</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-indigo-400 mb-2 font-bold text-lg">01</div>
            <p className="text-xs font-bold text-white uppercase">Inference Engine</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Google Gemini 1.5 Flash provides the low-latency probabilistic analysis of user sessions.
            </p>
          </div>
          <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-emerald-400 mb-2 font-bold text-lg">02</div>
            <p className="text-xs font-bold text-white uppercase">Persistence Layer</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Firebase NoSQL infrastructure handles neural identity synchronization and secure temporal logging.
            </p>
          </div>
          <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-brand-accent mb-2 font-bold text-lg">03</div>
            <p className="text-xs font-bold text-white uppercase">Reaction Logic</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Native TypeScript event loop manages neural triggers and snackbar SN-X notifications.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center pt-8 border-t border-white/5">
         <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono">
           CogniFlow Research Implementation &bull; {new Date().getFullYear()}
         </p>
      </footer>
    </motion.div>
  );
};
