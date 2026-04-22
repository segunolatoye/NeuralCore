/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  LayoutDashboard, 
  History, 
  Sparkles, 
  LogOut, 
  ChevronRight, 
  BookOpen, 
  User, 
  ChevronLeft, 
  PanelLeftClose, 
  PanelLeftOpen,
  Info
} from 'lucide-react';
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
import { HowToUse } from './components/HowToUse';
import { Profile } from './components/Profile';
import { About } from './components/About';
import { TutorialOverlay } from './components/TutorialOverlay';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'how-to' | 'profile' | 'about'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load sessions
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const loadedSessions = querySnapshot.docs
          .map(doc => doc.data() as LearningSession)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setSessions(loadedSessions);

        // Load profile analysis
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          if (!profileData.hasSeenTutorial) {
            setShowTutorial(true);
          }
          if (profileData.lastAnalysisInsights) {
            setAiAnalysis({
              debitScore: profileData.lastDebitScore || 0,
              insights: profileData.lastAnalysisInsights,
              recommendations: []
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

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    if (!user) return;
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, { hasSeenTutorial: true });
    } catch (err) {
      console.error("Failed to mark tutorial as seen:", err);
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
      await setDoc(doc(db, 'profiles', user.uid), {
        uid: user.uid,
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
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row">
      <ReminderNotification 
        reminder={activeNotification} 
        onClose={handleCloseNotification} 
      />
      
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
      
      {/* Sidebar Navigation - Desktop only */}
      <nav className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-950/20 backdrop-blur-2xl border-r border-white/5 text-white ${sidebarCollapsed ? 'p-3' : 'p-6'} flex flex-col hidden md:flex h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out group/sidebar relative`}>
        {/* Toggle Button on Border */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 bottom-32 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg z-50 transition-transform hover:scale-110 active:scale-95 border border-white/20"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} mb-12`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-brand-accent p-2 rounded-xl glow-border shrink-0">
              <Brain size={24} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-light tracking-tight text-white uppercase whitespace-nowrap"
              >
                NEURAL<span className="font-bold text-indigo-400">CORE</span>
              </motion.span>
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Dashboard"
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
              <LayoutDashboard size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">Dashboard</span>}
            </div>
            {!sidebarCollapsed && activeTab === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('sessions')}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all ${activeTab === 'sessions' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             title="All Logs"
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
              <History size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">All Logs</span>}
            </div>
            {!sidebarCollapsed && activeTab === 'sessions' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('how-to')}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all ${activeTab === 'how-to' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             title="Manual"
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
              <BookOpen size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">Manual</span>}
            </div>
            {!sidebarCollapsed && activeTab === 'how-to' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('profile')}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             title="Identity"
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
              <User size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">Identity</span>}
            </div>
            {!sidebarCollapsed && activeTab === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
          <button 
             onClick={() => setActiveTab('about')}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all ${activeTab === 'about' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             title="About Project"
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
              <Info size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">About</span>}
            </div>
            {!sidebarCollapsed && activeTab === 'about' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4 overflow-hidden">
          {user && (
            <div className={`${sidebarCollapsed ? 'px-0 justify-center' : 'px-2 gap-3'} py-3 glass-card bg-white/5 border-white/5 flex items-center`}>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              {!sidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs font-medium text-slate-100 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </motion.div>
              )}
              {!sidebarCollapsed && (
                <button 
                  onClick={logout}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2`}>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            {!sidebarCollapsed && <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-400">AI Central Active</span>}
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-950/40 backdrop-blur-3xl border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-accent p-1.5 rounded-lg">
            <Brain size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tighter text-white uppercase">NEURALCORE</span>
        </div>
        
        {user && (
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/5"
          >
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-6 h-6 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <header className="bg-brand-bg/60 backdrop-blur-xl px-4 py-4 md:px-8 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 gap-4 sticky top-0 md:relative z-40 hidden md:flex">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-light tracking-tight glow-text text-white uppercase">
                {activeTab === 'dashboard' ? 'NEURAL ENGINE' : 
                 activeTab === 'sessions' ? 'TEMPORAL LOGS' : 
                 activeTab === 'how-to' ? 'OPERATING MANUAL' : 
                 activeTab === 'about' ? 'PROJECT CREDITS' : 'NEURAL IDENTITY'}
              </h1>
              <div className="glass-pill text-[8px] md:text-[10px] text-slate-500 font-mono">v2.1</div>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1">
              {activeTab === 'dashboard' 
                ? 'Cognitive Debit & Learning Performance Engine' 
                : activeTab === 'sessions' 
                  ? 'System processing logs and historical records' 
                  : activeTab === 'how-to'
                    ? 'Protocol documentation for optimal system usage'
                    : activeTab === 'about'
                      ? 'Academic credentials and project information'
                      : 'User neural profile and cognitive parameters'}
            </p>
          </div>
          <div id="session-form-trigger" className="w-full sm:w-auto">
            <SessionForm onAdd={handleAddSession} isAnalyzing={isAnalyzing} />
          </div>
        </header>

        {/* Mobile Page Title & Action */}
        <div className="md:hidden px-4 pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-light tracking-tight text-white uppercase">
              {activeTab === 'dashboard' ? 'Neural Engine' : 
               activeTab === 'sessions' ? 'Temporal Logs' : 
               activeTab === 'how-to' ? 'Operating Manual' : 
               activeTab === 'about' ? 'Project Credits' : 'Neural Identity'}
            </h1>
            <SessionForm onAdd={handleAddSession} isAnalyzing={isAnalyzing} />
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">
            {activeTab === 'dashboard' ? 'Current Cognitive Load: ACTIVE' : 'Status: SYNCED'}
          </p>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                id="dashboard-content"
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 md:space-y-8"
              >
                {aiAnalysis && (
                  <div className="glass-card p-4 md:p-6 border-l-4 border-l-brand-accent">
                    <div className="flex items-start gap-4">
                      <div className="p-2 md:p-3 bg-brand-accent/10 rounded-xl md:rounded-2xl text-brand-accent glow-border shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div className="flex-1">
                        <span className="tech-label text-brand-accent mb-1 block underline underline-offset-4 decoration-brand-accent/30">AI Neural Feedback</span>
                        <p className="text-sm md:text-base leading-relaxed font-light text-slate-300 italic">
                          "{aiAnalysis.insights}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <DashboardCharts sessions={sessions} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <h3 className="tech-label text-[10px] md:text-[12px] text-slate-300">Optimized Strategies</h3>
                    </div>
                    <Recommendations 
                      recommendations={aiAnalysis?.recommendations || []} 
                      loading={isAnalyzing} 
                    />
                  </div>

                  <div id="reminder-manager" className="space-y-6 md:space-y-8">
                    <ReminderManager />
                    
                    <div className="space-y-4">
                      <h3 className="tech-label text-[10px] md:text-[12px] text-slate-300 px-2">Neural History</h3>
                      <div className="space-y-3">
                        {sessions.slice(-4).reverse().map((session) => (
                          <div key={session.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-default">
                          <div className="flex flex-col">
                            <p className="font-medium text-xs md:text-sm text-slate-200">{session.subject}</p>
                            <p className="text-[8px] md:text-[10px] text-slate-500 font-mono mt-1">
                              {format(new Date(session.timestamp), 'MMM dd | HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className={`data-stat text-xs md:text-sm font-bold ${session.cognitiveDebitScore > 60 ? 'text-rose-400' : 'text-indigo-300'}`}>
                               {session.cognitiveDebitScore || '...'}<span className="text-[6px] md:text-[8px] opacity-40 ml-0.5 uppercase">DBT</span>
                             </p>
                          </div>
                        </div>
                      ))}
                      {sessions.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-white/5 rounded-3xl opacity-40 italic text-xs">
                          No logs detected in neural stack
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            ) : activeTab === 'sessions' ? (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="glass-card overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="px-6 py-4 tech-label whitespace-nowrap">Temporal Stamp</th>
                        <th className="px-6 py-4 tech-label whitespace-nowrap">Target Modality</th>
                        <th className="px-6 py-4 tech-label text-center whitespace-nowrap">Neural Load</th>
                        <th className="px-6 py-4 tech-label text-center whitespace-nowrap">Retention</th>
                        <th className="px-6 py-4 tech-label text-right whitespace-nowrap">Debit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sessions.slice().reverse().map((s) => (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs md:text-sm font-medium text-slate-200">{format(new Date(s.timestamp), 'MMM dd, yyyy')}</span>
                            <br />
                            <span className="text-[8px] md:text-[10px] font-mono text-slate-500">{format(new Date(s.timestamp), 'HH:mm:ss')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs md:text-sm font-semibold text-indigo-300">{s.subject}</span>
                            <br />
                            <span className="text-[8px] md:text-[10px] text-slate-500">{s.durationMinutes}m duration</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="inline-flex w-24 md:w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500" 
                                  style={{ width: `${s.perceivedComplexity * 10}%` }}
                                />
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`font-mono text-xs md:text-sm font-bold glow-text ${s.performanceScore > 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                               {s.performanceScore}%
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`font-mono text-base md:text-lg font-bold ${s.cognitiveDebitScore > 65 ? 'text-rose-500' : 'text-brand-accent'}`}>
                               {s.cognitiveDebitScore}
                             </span>
                             <span className="text-[6px] md:text-[8px] ml-1 opacity-40 font-mono uppercase">DBT</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sessions.length === 0 && (
                    <div className="p-20 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                       Stack empty. Awaiting neural data ingestion.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'how-to' ? (
              <motion.div
                key="how-to"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <HowToUse />
              </motion.div>
            ) : activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Profile />
              </motion.div>
            ) : (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <About />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <footer className="p-8 text-center hidden md:block">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-mono">
             ARCHITECTURE BY NEURALCORE v2.1 &bull; PROCESSING ACTIVE
          </p>
        </footer>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-3xl border-t border-white/10 px-4 pt-3 pb-6 flex items-center justify-around">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Engine</span>
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'sessions' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <History size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Stack</span>
        </button>
        <button 
          onClick={() => setActiveTab('how-to')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'how-to' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <BookOpen size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Manual</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <User size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Self</span>
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'about' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <Info size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">About</span>
        </button>
        <button 
          onClick={logout}
          className="flex flex-col items-center gap-1.5 text-slate-600 hover:text-rose-500 transition-all"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Exit</span>
        </button>
      </nav>
    </div>
  );
}
