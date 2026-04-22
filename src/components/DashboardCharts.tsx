import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { LearningSession } from '../types';
import { format } from 'date-fns';

interface DashboardChartsProps {
  sessions: LearningSession[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sessions }) => {
  const chartData = sessions.map(s => ({
    name: format(new Date(s.timestamp), 'MMM dd HH:mm'),
    debit: s.cognitiveDebitScore,
    performance: s.performanceScore,
    complexity: s.perceivedComplexity * 10, // Normalized to 100 for comparison
    rawComplexity: s.perceivedComplexity, // Original 1-10 scale
  })).slice(-10);

  const DebitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border-indigo-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs text-slate-300">Debit:</span>
            <span className="text-sm font-bold text-white font-mono">{payload[0].value.toFixed(1)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const EfficiencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl min-w-[180px] space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{data.name}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Performance</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{data.performance}%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Complexity</span>
              <span className="text-sm font-bold text-indigo-400 font-mono font-bold">{data.rawComplexity}/10</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
               <div className="h-full bg-emerald-400" style={{ width: `${data.performance}%` }} />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cognitive Debit Over Time */}
      <div className="glass-card p-6 min-h-[350px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="tech-label">Metric</span>
            <h3 className="text-lg font-medium glow-text">Cognitive Debit Variance</h3>
          </div>
          <div className="text-right">
            <span className="tech-label">Avg</span>
            <p className="data-stat text-xl text-indigo-400">
              {sessions.length > 0
                ? (sessions.reduce((acc, s) => acc + s.cognitiveDebitScore, 0) / sessions.length).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DebitTooltip />} />
              <Area 
                type="monotone" 
                dataKey="debit" 
                stroke="#818cf8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDebit)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance vs Complexity */}
      <div className="glass-card p-6 min-h-[350px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="tech-label">Correlation</span>
            <h3 className="text-lg font-medium glow-text">Efficiency Index</h3>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<EfficiencyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="performance" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.performance > 80 ? '#34d399' : '#818cf8'} fillOpacity={0.8} />
                ))}
              </Bar>
              <Bar dataKey="complexity" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
