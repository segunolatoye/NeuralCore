import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Sparkles, Brain, History, LayoutDashboard, Bell, ArrowRight, CheckCircle } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string; // Element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: "Welcome to NeuralCore",
      description: "Welcome back to your neural command center. Let's take a quick 3-step tour to optimize your learning flow.",
      icon: <Brain className="text-white" size={32} />,
      position: 'center'
    },
    {
      title: "Log Your Progress",
      description: "Every learning session should be logged. Capture duration, difficulty, and your 'Flow State' to help the AI refine your cognitive parameters.",
      icon: <History className="text-indigo-400" size={24} />,
      selector: '#session-form-trigger',
      position: 'bottom'
    },
    {
      title: "Analyze & Optimize",
      description: "The Dashboard visualizes your Cognitive Debit. Switch between tabs to see detailed charts, neural history, and custom AI recommendations.",
      icon: <LayoutDashboard className="text-emerald-400" size={24} />,
      selector: '#dashboard-content',
      position: 'top'
    },
    {
      title: "Set Neural Triggers",
      description: "Consistency is key. Use the Trigger Manager to schedule future deep work sessions and receive neural activation alerts.",
      icon: <Bell className="text-orange-400" size={24} />,
      selector: '#reminder-manager',
      position: 'left'
    },
    {
      title: "Neural Profile Ready",
      description: "You're all set. The more you log, the smarter your NeuralCore becomes. Time to head to the Command Center.",
      icon: <CheckCircle className="text-emerald-400" size={32} />,
      position: 'center'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative max-w-md w-full glass-card p-8 border-brand-accent/30 shadow-[0_0_50px_rgba(129,140,248,0.2)] text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-indigo-500/20 rounded-3xl glow-border">
              {step.icon}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="tech-label text-indigo-400">Step {currentStep + 1} of {steps.length}</span>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="tech-label text-slate-500">System Orientation</span>
            </div>
            <h2 className="text-2xl font-light tracking-tight text-white uppercase">{step.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed italic">
              "{step.description}"
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {currentStep === steps.length - 1 ? 'Begin Neural Cycle' : 'Proceed'} <ArrowRight size={14} />
            </button>
          </div>

          {/* Navigation & Skip Group */}
          <div className="space-y-4 pt-2">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-indigo-400 w-4 shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'bg-slate-800'}`}
                />
              ))}
            </div>

            {/* Skip functionality */}
            {currentStep < steps.length - 1 && (
              <button 
                onClick={onComplete}
                className="text-[10px] text-slate-600 hover:text-white uppercase tracking-[0.2em] font-mono transition-colors outline-none focus:text-white py-1 px-4 border border-transparent hover:border-white/5 rounded-full"
              >
                Skip Tutorial
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
