/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Brain, LayoutDashboard, History, Sparkles, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearningSession, AIRecommendation } from './types';
import { DashboardCharts } from './components/DashboardCharts';
import { SessionForm } from './components/SessionForm';
import { Recommendations } from './components/Recommendations';
import { analyzeLearningPerformance } from './services/geminiService';
import { format } from 'date-fns';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  limit,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';

import { ReminderManager } from './components/ReminderManager';
import { ReminderNotification } from './components/ReminderNotification';
import { LearningReminder } from './types';
import { isBefore, parseISO } from 'date-fns';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [reminders, setReminders] = useState<LearningReminder[]>([]);
  const [activeNotification, setActiveNotification] = useState<LearningReminder | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{
    debitScore: number;
    recommendations: AIRecommendation[];
    insights: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions'>('dashboard');

  // Load user data on mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load sessions
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const loadedSessions = querySnapshot.docs.map(doc => doc.data() as LearningSession);
        setSessions(loadedSessions);

        // Load profile analysis
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          if (profile.lastAnalysisInsights) {
            setAiAnalysis({
              debitScore: profile.lastDebitScore || 0,
              insights: profile.lastAnalysisInsights,
              recommendations: [] // Recommendations are ephemeral usually or could be saved
            });
          }
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadData();
  }, [user]);

  // Polling for reminders
  useEffect(() => {
    if (!user) return;

    // Listen to reminders
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid),
      where('notified', '==', false)
    );
    
    let localReminders: LearningReminder[] = [];
    const unsubscribe = onSnapshot(q, (snapshot) => {
      localReminders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LearningReminder[];
      setReminders(localReminders);
    });

    const interval = setInterval(() => {
      const now = new Date();
      const trigger = localReminders.find(r => isBefore(parseISO(r.timestamp), now));
      
      if (trigger && !activeNotification) {
        setActiveNotification(trigger);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, activeNotification]);

  const handleCloseNotification = async (id: string) => {
    setActiveNotification(null);
    try {
      await updateDoc(doc(db, 'reminders', id), {
        notified: true
      });
    } catch (err) {
      console.error("Failed to mark reminder as notified:", err);
    }
  };

  const handleAddSession = async (sessionData: Omit<LearningSession, 'id' | 'userId' | 'cognitiveDebitScore'>) => {
    if (!user) return;
    
    const sessionId = Math.random().toString(36).substr(2, 9);
    const newSession: LearningSession = {
      ...sessionData,
      id: sessionId,
      userId: user.uid,
      cognitiveDebitScore: 0
    };

    // Optimistic update
    setSessions(prev => [...prev, newSession]);
    setIsAnalyzing(true);
    
    try {
      // Get AI Analysis
      const analysis = await analyzeLearningPerformance([...sessions, newSession]);
      const finalSession = {
        ...newSession,
        cognitiveDebitScore: analysis.debitScore
      };
      
      // Save session to Firestore
      await setDoc(doc(db, 'sessions', sessionId), finalSession);

      // Update User Profile (ensure it exists or create)
      await setDoc(doc(db, 'users', user.uid), {
        lastDebitScore: analysis.debitScore,
        lastAnalysisInsights: analysis.insights
      }, { merge: true });

      // Update local state with final AI results
      setSessions(prev => prev.map(s => s.id === sessionId ? finalSession : s));
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Neural Analysis Failed:", error);
      // Even if AI fails, ensure the session is saved with 0 debit
      try {
        await setDoc(doc(db, 'sessions', sessionId), newSession);
      } catch (dbError) {
        console.error("Critical: Database Write Failed:", dbError);
        // Rollback optimistic update if even DB save fails
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <ReminderNotification 
        reminder={activeNotification} 
        onClose={handleCloseNotification} 
      />
      <nav className="w-64 bg-slate-950/20 backdrop-blur-2xl border-r border-white/5 text-white p-6 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-brand-accent p-2 rounded-xl glow-border">
            <Brain size={24} className="text-white" />
          </div>
          <span className="text-xl font-light tracking-tight text-white uppercase">NEURAL<span className="font-bold text-indigo-400">CORE</span></span>
        </div>

        <div className="space-y-4 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </div>
            {activeTab === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('sessions')}
             className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${activeTab === 'sessions' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <History size={20} />
              <span className="font-medium">All Logs</span>
            </div>
            {activeTab === 'sessions' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          {user && (
            <div className="px-4 py-3 glass-card bg-white/5 border-white/5 flex items-center gap-3">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-100 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-400">AI Central Active</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl px-8 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-light tracking-tight glow-text">
                {activeTab === 'dashboard' ? 'NEURAL ENGINE' : 'TEMPORAL LOGS'}
              </h1>
              <div className="glass-pill text-[10px] text-slate-500 font-mono">v2.1</div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'dashboard' ? 'Cognitive Debit & Learning Performance Engine' : 'System processing logs and historical records'}
            </p>
          </div>
          <SessionForm onAdd={handleAddSession} isAnalyzing={isAnalyzing} />
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {aiAnalysis && (
                  <div className="glass-card p-6 border-l-4 border-l-brand-accent">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent glow-border">
                        <Sparkles size={24} />
                      </div>
                      <div className="flex-1">
                        <span className="tech-label text-brand-accent mb-1 block underline underline-offset-4 decoration-brand-accent/30">AI Neural Feedback</span>
                        <p className="leading-relaxed font-light text-slate-300 italic">
                          "{aiAnalysis.insights}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <DashboardCharts sessions={sessions} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <h3 className="tech-label text-[12px] text-slate-300">Optimized Strategies</h3>
                    </div>
                    <Recommendations 
                      recommendations={aiAnalysis?.recommendations || []} 
                      loading={isAnalyzing} 
                    />
                  </div>

                  <div className="space-y-8">
                    <ReminderManager />
                    
                    <div className="space-y-4">
                      <h3 className="tech-label text-[12px] text-slate-300 px-2">Neural History</h3>
                      <div className="space-y-4">
                        {sessions.slice(-4).reverse().map((session) => (
                          <div key={session.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-default">
                          <div className="flex flex-col">
                            <p className="font-medium text-sm text-slate-200">{session.subject}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                              {format(new Date(session.timestamp), 'MMM dd | HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className={`data-stat text-sm font-bold ${session.cognitiveDebitScore > 60 ? 'text-rose-400' : 'text-indigo-300'}`}>
                               {session.cognitiveDebitScore || '...'}<span className="text-[8px] opacity-40 ml-0.5">DBT</span>
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="px-6 py-4 tech-label">Temporal Stamp</th>
                        <th className="px-6 py-4 tech-label">Target Modality</th>
                        <th className="px-6 py-4 tech-label text-center">Neural Load</th>
                        <th className="px-6 py-4 tech-label text-center">Retention</th>
                        <th className="px-6 py-4 tech-label text-right">Debit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sessions.slice().reverse().map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-200">{format(new Date(s.timestamp), 'MMM dd, yyyy')}</span>
                            <br />
                            <span className="text-[10px] font-mono text-slate-500">{format(new Date(s.timestamp), 'HH:mm:ss')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-indigo-300">{s.subject}</span>
                            <br />
                            <span className="text-[10px] text-slate-500">{s.durationMinutes}m duration</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="inline-flex w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500" 
                                  style={{ width: `${s.perceivedComplexity * 10}%` }}
                                />
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`font-mono text-sm font-bold glow-text ${s.performanceScore > 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                               {s.performanceScore}%
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`font-mono text-lg font-bold ${s.cognitiveDebitScore > 65 ? 'text-rose-500' : 'text-brand-accent'}`}>
                               {s.cognitiveDebitScore}
                             </span>
                             <span className="text-[8px] ml-1 opacity-40 font-mono">DBT</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <footer className="p-8 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-mono">
             ARCHITECTURE BY NEURALCORE v2.1 &bull; PROCESSING ACTIVE
          </p>
        </footer>
      </main>
    </div>
  );
}
