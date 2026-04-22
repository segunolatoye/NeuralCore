import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, X, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';
import { LearningReminder, LearningSession } from '../types';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { format, isAfter, parseISO } from 'date-fns';

export const ReminderManager: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<LearningReminder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    sessionType: 'deep-work' as LearningSession['sessionType']
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedReminders = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as LearningReminder[];
      setReminders(loadedReminders);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.subject) return;

    const timestamp = `${formData.date}T${formData.time}:00`;
    const id = editingId || Math.random().toString(36).substr(2, 9);
    
    try {
      await setDoc(doc(db, 'reminders', id), {
        id,
        userId: user.uid,
        subject: formData.subject,
        timestamp,
        sessionType: formData.sessionType,
        notified: false
      });
      setIsOpen(false);
      setEditingId(null);
      setFormData({
        subject: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        sessionType: 'deep-work'
      });
    } catch (err) {
      console.error("Failed to save reminder:", err);
    }
  };

  const handleEdit = (reminder: LearningReminder) => {
    const date = parseISO(reminder.timestamp);
    setFormData({
      subject: reminder.subject,
      date: format(date, 'yyyy-MM-dd'),
      time: format(date, 'HH:mm'),
      sessionType: reminder.sessionType
    });
    setEditingId(reminder.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      subject: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      sessionType: 'deep-work'
    });
  };

  const upcomingReminders = reminders.filter(r => !r.notified && isAfter(parseISO(r.timestamp), new Date()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Bell size={20} />
          </div>
          <h2 className="text-xl font-light tracking-tight text-white uppercase">Neural <span className="font-bold text-indigo-400">Triggers</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setIsOpen(true);
            }}
            className="p-2 hover:bg-white/5 rounded-full text-indigo-400 transition-colors"
            title="Add Reminder"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {upcomingReminders.length === 0 ? (
          <div className="glass-card p-6 border-white/5 text-center space-y-2">
            <AlertCircle size={32} className="mx-auto text-slate-600" />
            <p className="text-slate-500 text-sm italic">"No upcoming cognitive sessions found in your neural queue."</p>
          </div>
        ) : (
          upcomingReminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  reminder.sessionType === 'deep-work' ? 'bg-indigo-500' : 
                  reminder.sessionType === 'active-recall' ? 'bg-emerald-500' : 'bg-slate-500'
                } shadow-[0_0_8px_currentColor]`} />
                <div>
                  <h3 className="text-sm font-medium text-white">{reminder.subject}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={10} /> {format(parseISO(reminder.timestamp), 'MMM d')}
                    <Clock size={10} /> {format(parseISO(reminder.timestamp), 'HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleEdit(reminder)}
                  className="p-2 text-slate-400 hover:text-indigo-400"
                  title="Edit Trigger"
                >
                  <Clock size={16} />
                </button>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="p-2 text-slate-400 hover:text-rose-500"
                  title="Delete Trigger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-light tracking-tight text-white uppercase">{editingId ? 'Update' : 'Set'} <span className="font-bold text-indigo-400">Trigger</span></h3>
                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-6">
                <div>
                  <label className="tech-label mb-2 block">Cognitive Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="e.g. Brain Anatomy"
                    className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="tech-label mb-2 block">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="tech-label mb-2 block">Time</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="tech-label mb-2 block">Planned Session Type</label>
                  <select
                    value={formData.sessionType}
                    onChange={(e) => setFormData({...formData, sessionType: e.target.value as any})}
                    className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 transition-all font-mono text-sm"
                  >
                    <option value="deep-work">Deep Work</option>
                    <option value="active-recall">Active Recall</option>
                    <option value="light-review">Light Review</option>
                    <option value="lecture">Lecture</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs shadow-lg transition-all"
                >
                  {editingId ? 'Update Trigger' : 'Schedule Trigger'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
