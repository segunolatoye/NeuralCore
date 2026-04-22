import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LearningSession } from '../types';
import { Plus, X, Brain, Activity, Clock, Target, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionFormProps {
  onAdd: (session: Omit<LearningSession, 'id' | 'userId' | 'cognitiveDebitScore'>) => void;
  isAnalyzing?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onAdd, isAnalyzing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    subject: '',
    durationMinutes: 45,
    perceivedComplexity: 5,
    distractions: 2,
    energyLevel: 7,
    performanceScore: 80,
    sessionType: 'deep-work' as LearningSession['sessionType'],
    studyEnvironment: 'Quiet' as LearningSession['studyEnvironment'],
    flowStateRating: 5,
    notes: ''
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (formData.durationMinutes <= 0) newErrors.durationMinutes = 'Duration must be positive';
    if (formData.performanceScore < 0 || formData.performanceScore > 100) {
      newErrors.performanceScore = 'Score must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onAdd({
      ...formData,
      timestamp: new Date().toISOString()
    });
    setIsOpen(false);
    setFormData({
      subject: '',
      durationMinutes: 45,
      perceivedComplexity: 5,
      distractions: 2,
      energyLevel: 7,
      performanceScore: 80,
      sessionType: 'deep-work',
      studyEnvironment: 'Quiet',
      flowStateRating: 5,
      notes: ''
    });
    setErrors({});
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setIsOpen(true);
          setErrors({});
        }}
        className="flex items-center gap-2 bg-brand-accent text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
      >
        <Plus size={18} />
        Log Session
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 sm:items-center overflow-y-auto bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0"
              />
              
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-slate-900/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 glow-border shrink-0">
                    <Brain size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-light tracking-tight text-white uppercase truncate">Initialize <span className="font-bold text-indigo-400">Data Point</span></h2>
                    <p className="text-[10px] text-slate-500 italic hidden sm:block">"Am I pushing my brain too hard?"</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <div>
                    <label className="tech-label mb-2 block">What were you doing?</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Physics Homework, Coding, etc."
                      className={`w-full bg-white/5 px-4 py-2 rounded-xl border ${errors.subject ? 'border-rose-500/50' : 'border-white/10'} text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm placeholder:text-slate-700`}
                    />
                    {errors.subject && <p className="text-[10px] text-rose-400 mt-1 font-mono uppercase tracking-wider">{errors.subject}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="tech-label mb-2 block">How much "Gas" used? (min)</label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                        className={`w-full bg-white/5 px-4 py-2 rounded-xl border ${errors.durationMinutes ? 'border-rose-500/50' : 'border-white/10'} text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm`}
                      />
                    </div>
                    <div>
                      <label className="tech-label mb-2 block">Session Type</label>
                      <select
                        value={formData.sessionType}
                        onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as any })}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                      >
                        <option value="deep-work">Deep Work (Hard)</option>
                        <option value="light-review">Light Review (Easy)</option>
                        <option value="active-recall">Active Recall (Medium)</option>
                        <option value="lecture">Lecture / Passive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="tech-label mb-2 block">Study Environment</label>
                      <select
                        value={formData.studyEnvironment}
                        onChange={(e) => setFormData({ ...formData, studyEnvironment: e.target.value as any })}
                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                      >
                        <option value="Quiet">Quiet</option>
                        <option value="Moderate Noise">Moderate Noise</option>
                        <option value="Distracting">Distracting</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="tech-label flex items-center gap-2 text-indigo-300">
                          <Activity size={12} /> "Flow State" / Focus (1-10)
                        </label>
                        <span className="text-xs font-mono font-medium text-emerald-400">{formData.flowStateRating}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic pb-1">Did you lose track of time? High flow saves brain energy.</p>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.flowStateRating}
                        onChange={(e) => setFormData({ ...formData, flowStateRating: parseInt(e.target.value) })}
                        className="w-full accent-emerald-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="tech-label flex items-center gap-2 text-indigo-300">
                          <Target size={12} /> Performance/Retention (0-100%)
                        </label>
                        <span className="text-xs font-mono font-medium text-indigo-400">{formData.performanceScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.performanceScore}
                        onChange={(e) => setFormData({ ...formData, performanceScore: parseInt(e.target.value) })}
                        className="w-full accent-indigo-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="tech-label flex items-center gap-2 text-indigo-300">
                          <Activity size={12} /> Difficulty Level (1-10)
                        </label>
                        <span className="text-xs font-mono font-medium text-indigo-400">{formData.perceivedComplexity}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.perceivedComplexity}
                        onChange={(e) => setFormData({ ...formData, perceivedComplexity: parseInt(e.target.value) })}
                        className="w-full accent-indigo-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="tech-label text-emerald-400/80">Energy (1-10)</label>
                          <span className="text-xs font-mono font-medium text-emerald-400">{formData.energyLevel}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.energyLevel}
                          onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                          className="w-full accent-emerald-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="tech-label text-rose-400/80">Distractions (1-10)</label>
                          <span className="text-xs font-mono font-medium text-rose-400">{formData.distractions}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.distractions}
                          onChange={(e) => setFormData({ ...formData, distractions: parseInt(e.target.value) })}
                          className="w-full accent-rose-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="tech-label mb-2 block">Qualitative Observations</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any specifics on brain fog or focus?"
                        className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm min-h-[80px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full bg-indigo-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Neural Processing...
                      </>
                    ) : (
                      'Check my Brain Debt'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};
