export interface LearningPreferences {
  primaryGoal: string;
  preferredSessionDuration: number;
  dailyTargetMinutes: number;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  focusMusic: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  preferences: LearningPreferences;
  joinedAt: string;
  lastAnalysisInsights?: string;
  lastDebitScore?: number;
  hasSeenTutorial?: boolean;
}

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
  studyEnvironment: 'Quiet' | 'Moderate Noise' | 'Distracting';
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
