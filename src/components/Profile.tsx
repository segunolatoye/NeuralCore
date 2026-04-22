import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  Target, 
  Clock, 
  Save, 
  CheckCircle, 
  Music, 
  BrainCircuit,
  Mail,
  FileEdit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserProfile, LearningPreferences } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<{
    displayName: string;
    bio: string;
    preferences: LearningPreferences;
  }>({
    displayName: '',
    bio: '',
    preferences: {
      primaryGoal: 'Master Calculus',
      preferredSessionDuration: 45,
      dailyTargetMinutes: 120,
      learningStyle: 'visual',
      focusMusic: true
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setFormData({
            displayName: data.displayName || user.displayName || '',
            bio: data.bio || '',
            preferences: data.preferences
          });
        } else {
          // Initialize default profile
          const initialData: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            joinedAt: new Date().toISOString(),
            preferences: formData.preferences,
            hasSeenTutorial: false
          };
          setProfile(initialData);
          setFormData({
            displayName: initialData.displayName,
            bio: '',
            preferences: initialData.preferences
          });
          await setDoc(docRef, initialData);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedProfile: UserProfile = {
        ...profile,
        displayName: formData.displayName,
        bio: formData.bio,
        preferences: formData.preferences,
        hasSeenTutorial: profile.hasSeenTutorial
      };

      await setDoc(doc(db, 'profiles', user.uid), updatedProfile);
      setProfile(updatedProfile);
      setSaveSuccess(true);
      toast("Identity Synchronized", "success", "Neural parameters and cognitive preferences updated successfully.");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast("Sync Sequence Failed", "error", "Critical error during neural identity synchronization.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent glow-border">
             <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white uppercase">Neural <span className="font-bold text-brand-accent">Identity</span></h1>
            <p className="text-xs text-slate-500 font-mono">UID: {user?.uid.slice(0, 12)}...</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-brand-accent p-1 shadow-lg shadow-indigo-500/20">
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase">{formData.displayName || 'Unnamed Pulse'}</h3>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center justify-center gap-1">
                  <Mail size={10} /> {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="tech-label mb-2 block flex items-center gap-2">
                  <FileEdit size={12} /> Neural Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your neural network about yourself..."
                  className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-xs min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 md:p-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-3">
              <Settings className="text-indigo-400" size={20} />
              Cognitive Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="tech-label mb-2 block flex items-center gap-2">
                    <Target size={14} className="text-emerald-400" /> Primary Neural Goal
                  </label>
                  <input
                    type="text"
                    value={formData.preferences.primaryGoal}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, primaryGoal: e.target.value }
                    })}
                    className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="tech-label mb-2 block flex items-center gap-2">
                    <Clock size={14} className="text-indigo-400" /> Session Burst (Min)
                  </label>
                  <input
                    type="number"
                    value={formData.preferences.preferredSessionDuration}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, preferredSessionDuration: parseInt(e.target.value) }
                    })}
                    className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="tech-label mb-2 block flex items-center gap-2">
                    <BrainCircuit size={14} className="text-brand-accent" /> Learning Style
                  </label>
                  <select
                    value={formData.preferences.learningStyle}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, learningStyle: e.target.value as any }
                    })}
                    className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                  >
                    <option value="visual">Visual / Spatial</option>
                    <option value="auditory">Auditory / Acoustic</option>
                    <option value="kinesthetic">Physical / Kinesthetic</option>
                    <option value="reading">Reading / Writing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="tech-label mb-2 block">Daily Neural Quota (Min)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="480"
                      step="15"
                      value={formData.preferences.dailyTargetMinutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, dailyTargetMinutes: parseInt(e.target.value) }
                      })}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-white font-mono text-sm w-12">{formData.preferences.dailyTargetMinutes}m</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.preferences.focusMusic ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Music size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">Focus Melodics</p>
                      <p className="text-[10px] text-slate-500 italic">Allow AI background themes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, focusMusic: !formData.preferences.focusMusic }
                    })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.preferences.focusMusic ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.preferences.focusMusic ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-brand-accent hover:bg-indigo-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Sync Identity
                  </>
                )}
              </button>
              
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase tracking-wider"
                  >
                    <CheckCircle size={16} /> Success
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};
