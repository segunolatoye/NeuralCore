export type CognitiveLoadLevel = 'low' | 'moderate' | 'high' | 'peak';

export interface LearningSession {
  id: string;
  userId: string;
  timestamp: string;
  durationMinutes: number;
  subject: string;
  perceivedComplexity: number; // 1-10
  distractions: number; // 1-10
  energyLevel: number; // 1-10
  performanceScore: number; // 0-100
  sessionType: 'deep-work' | 'light-review' | 'active-recall' | 'lecture';
  flowStateRating: number; // 1-10 (How 'in the zone' were you?)
  notes?: string;
  cognitiveDebitScore: number; 
}

export interface CognitivePulseStats {
  averageLoad: number;
  retentionRate: number;
  optimalFocusWindow: string;
  debitWarning: boolean;
}

export interface AIRecommendation {
  type: 'recovery' | 'strategy' | 'warning';
  title: string;
  description: string;
  actionableStep: string;
}

export interface LearningReminder {
  id: string;
  userId: string;
  subject: string;
  timestamp: string; // ISO string for when the reminder should trigger
  sessionType: LearningSession['sessionType'];
  notified: boolean;
}
