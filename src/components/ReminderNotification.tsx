import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Clock } from 'lucide-react';
import { LearningReminder } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addMinutes, format } from 'date-fns';

interface ReminderNotificationProps {
  reminder: LearningReminder | null;
  onClose: (id: string) => void;
}

export const ReminderNotification: React.FC<ReminderNotificationProps> = ({ reminder, onClose }) => {
  const handleSnooze = async () => {
    if (!reminder) return;
    
    try {
      const newTime = addMinutes(new Date(), 15);
      await updateDoc(doc(db, 'reminders', reminder.id), {
        timestamp: newTime.toISOString(),
        notified: false
      });
      onClose(reminder.id);
    } catch (err) {
      console.error("Failed to snooze reminder:", err);
    }
  };

  return (
    <AnimatePresence>
      {reminder && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm"
        >
          <div className="glass-card p-6 border-indigo-500/50 bg-indigo-950/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Bell className="animate-bounce" size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-bold text-indigo-400 tracking-[0.2em] uppercase">Neural Activation Required</h4>
                <h3 className="text-lg font-medium text-white">{reminder.subject}</h3>
                <p className="text-xs text-slate-400 italic">"It is time to engage in {reminder.sessionType.replace('-', ' ')} mode."</p>
              </div>
              <button 
                onClick={() => onClose(reminder.id)}
                className="p-1 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button 
                onClick={() => onClose(reminder.id)}
                className="w-full bg-indigo-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold tracking-widest uppercase text-[10px] transition-all flex items-center justify-center gap-2"
              >
                Initiate Session
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handleSnooze}
                  className="flex-1 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Clock size={12} />
                  Snooze 15m
                </button>
                <button 
                  onClick={() => onClose(reminder.id)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
