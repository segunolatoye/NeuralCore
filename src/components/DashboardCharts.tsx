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
  })).slice(-10);

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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                  fontSize: '12px',
                  color: '#f8fafc'
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                  fontSize: '12px',
                  color: '#f8fafc'
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
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
