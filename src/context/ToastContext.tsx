import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  details?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', details?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, details }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                min-w-[300px] max-w-[400px] glass-card p-4 flex items-start gap-4 
                relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1
                ${t.type === 'success' ? 'before:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 
                  t.type === 'error' ? 'before:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 
                  'before:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]'}
              `}>
                <div className={`
                  p-1.5 rounded-lg shrink-0
                  ${t.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                    t.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 
                    'bg-indigo-500/10 text-indigo-400'}
                `}>
                  {t.type === 'success' && <CheckCircle2 size={18} />}
                  {t.type === 'error' && <AlertCircle size={18} />}
                  {t.type === 'info' && <Info size={18} />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider leading-none">
                    {t.type === 'error' ? 'Neural Exception' : 
                     t.type === 'success' ? 'Sequence Synchronized' : 'Process Insight'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.message}
                  </p>
                  {t.details && (
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-2 border-t border-white/5 pt-2">
                      {t.details}
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => removeToast(t.id)}
                  className="text-slate-600 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
