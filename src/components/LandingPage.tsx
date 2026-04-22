import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, LogIn, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, Github, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LandingPage: React.FC = () => {
  const { signIn, signInWithEmail, signUpWithEmail, sendPasswordReset, loading, error, clearError } = useAuth();
  const { toast } = useToast();
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setResetSent(false);
    try {
      if (isForgotPassword) {
        await sendPasswordReset(email);
        setResetSent(true);
        toast("Recovery sequence initiated", "success", `A reset link has been dispatched to ${email}. Check your neural channels.`);
        // Reset the mode after a delay so they can sign in
        setTimeout(() => {
          setResetSent(false);
          setIsForgotPassword(false);
        }, 3000);
      } else if (isSignUp) {
        await signUpWithEmail(email, password, name);
        setSuccess(true);
        toast("Profile Construction Complete", "success", `Welcome to the core, ${name}. Neural identity established.`);
      } else {
        await signInWithEmail(email, password);
        setSuccess(true);
        toast("Neural Access Granted", "success", "Credential verification complete. Synchronizing neural profile...");
      }
    } catch (err: any) {
      setSuccess(false);
      setResetSent(false);
      toast("Authentication Exception", "error", err.message || "Credential verification failed.");
    }
  };

  const handleGoogleAuth = async () => {
    setSuccess(false);
    try {
      await signIn();
      setSuccess(true);
      toast("Google Identity Synced", "success", "Neural access granted via external identity provider.");
    } catch (err: any) {
      setSuccess(false);
      toast("Identity Sync Failed", "error", err.message || "Manual verification required.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/10 blur-[120px]" />

      <AnimatePresence>
        {(loading || success || resetSent) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-bg/80 backdrop-blur-md"
          >
            <div className="relative">
              {(!success && !resetSent) ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
                />
              ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-emerald-500/20 border-4 border-emerald-500 rounded-full flex items-center justify-center"
                >
                  <ShieldCheck className="text-emerald-500" size={48} />
                </motion.div>
              )}
              {(!success && !resetSent) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="text-white animate-pulse" size={32} />
                </div>
              )}
            </div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-2 text-center px-6"
            >
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">
                {success ? (isSignUp ? 'Profile Constructed' : 'Neural Access Granted') : 
                 resetSent ? 'Transmission Complete' :
                 (isForgotPassword ? 'Transmitting Reset Path' :
                  (isSignUp ? 'Constructing Profile' : (isEmailMode ? 'Signing In' : 'Initiating Handshake')))}
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                {success ? 'Synchronicity Achieved. Entering Core...' : 
                 resetSent ? 'Check your inbound neural channels.' :
                 'Synchronizing Neural Channels...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center space-y-8 relative z-10"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 bg-slate-900/40 backdrop-blur-xl rounded-3xl glow-border border border-white/10"
          >
            <Brain size={48} className="text-white" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-light tracking-tight text-white uppercase sm:text-5xl">
              NEURAL<span className="font-bold text-indigo-400">CORE</span>
            </h1>
            <p className="text-slate-400 text-sm font-light tracking-widest uppercase">
              The Cognitive Debit & Performance Engine
            </p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6 border-white/5">
          <AnimatePresence mode="wait">
            {!isEmailMode ? (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <p className="text-slate-300 text-sm italic font-light">
                  "Optimize your cognitive capacity through AI-driven neural analysis."
                </p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase tracking-wider font-mono"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEmailMode(true);
                        setIsSignUp(false);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 rounded-xl font-bold tracking-widest uppercase text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98]"
                    >
                      <LogIn size={14} />
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsEmailMode(true);
                        setIsSignUp(true);
                      }}
                      className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 py-3.5 rounded-xl font-bold tracking-widest uppercase text-[10px] transition-all flex items-center justify-center gap-2 border border-indigo-500/20 active:scale-[0.98]"
                    >
                      <UserIcon size={14} />
                      Sign Up
                    </button>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">OR</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <button
                    onClick={handleGoogleAuth}
                    className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold tracking-widest uppercase text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google Identity sync
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-xs uppercase tracking-[0.2em] font-bold">
                    {isForgotPassword ? 'Neural Cipher Reset' : 
                     isSignUp ? 'New Profile Construction' : 'Credential Verification'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsEmailMode(false);
                      setIsForgotPassword(false);
                      clearError();
                      setResetSent(false);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Back to Protocols
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase tracking-wider font-mono">
                    {error}
                  </div>
                )}

                {resetSent && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    Reset link transmitted to neural path. Check your inbox.
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {!isForgotPassword && isSignUp && (
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Learner Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-light"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input
                      type="email"
                      placeholder="Neural Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-light"
                    />
                  </div>

                  {!isForgotPassword && (
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Security Cipher"
                        required={!isForgotPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold tracking-widest uppercase text-[11px] shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isForgotPassword ? 'Transmit Reset Path' : 
                     isSignUp ? 'Construct Profile' : 'Access Core'}
                    <ArrowRight size={14} />
                  </button>
                </form>

                <div className="pt-2 flex flex-col gap-3">
                  {!isForgotPassword && !isSignUp && (
                    <button
                      onClick={() => {
                        setIsForgotPassword(true);
                        clearError();
                      }}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors mb-1"
                    >
                      Forgotten your cipher?
                    </button>
                  )}

                  {isForgotPassword ? (
                    <button
                      onClick={() => {
                        setIsForgotPassword(false);
                        clearError();
                        setResetSent(false);
                      }}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                    >
                      Return to Credential Verification
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        clearError();
                      }}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                    >
                      {isSignUp ? 'Already have a profile? Access here' : 'Need a new neural profile? Construct one'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            Neural-Grade Encryption Active
          </div>
        </div>

        <div className="flex justify-center gap-8 pt-4">
            {[ 
              { label: "Realtime", val: "ACTIVE" },
              { label: "AI Neural", val: "READY" },
              { label: "Temporal", val: "SYNCED" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-700 uppercase tracking-[0.2em]">{stat.label}</span>
                <span className="text-[10px] font-mono text-indigo-400/60 font-bold">{stat.val}</span>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
