import React from 'react';
import { AIRecommendation } from '../types';
import { RefreshCcw, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RecommendationsProps {
  recommendations: AIRecommendation[];
  loading?: boolean;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-6 w-48 bg-slate-300 rounded mb-2" />
            <div className="h-4 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-6 group cursor-default hover:bg-white/10"
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              rec.type === 'recovery' ? 'bg-emerald-500/10 text-emerald-400' :
              rec.type === 'strategy' ? 'bg-indigo-500/10 text-indigo-400' :
              'bg-amber-500/10 text-amber-400'
            }`}>
              {rec.type === 'recovery' && <RefreshCcw size={20} />}
              {rec.type === 'strategy' && <Zap size={20} />}
              {rec.type === 'warning' && <AlertTriangle size={20} />}
            </div>
            <div className="flex-1">
              <span className="tech-label text-brand-secondary">{rec.type}</span>
              <h4 className="font-semibold text-lg mb-1 text-slate-100">{rec.title}</h4>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed font-light">
                {rec.description}
              </p>
              <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs tracking-wider uppercase group-hover:gap-3 transition-all">
                <span>{rec.actionableStep}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      
      {recommendations.length === 0 && (
        <div className="glass-card p-8 border-dashed border-2 flex flex-col items-center justify-center text-center opacity-60">
           <Zap size={32} className="text-slate-300 mb-4" />
           <p className="font-medium">No active recommendations</p>
           <p className="text-sm">Log your first session to receive AI-driven hints.</p>
        </div>
      )}
    </div>
  );
};
