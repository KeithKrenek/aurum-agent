// src/types/interview.ts

export interface Interview {
  brandName: string;
  threadId: string;
  createdAt: Date;
  lastUpdated: Date;
  currentPhase: PhaseId;
  messages: Message[];
  reports: Reports;
}

export type PhaseId = 'discovery' | 'messaging' | 'audience' | 'complete';

export interface Reports {
  discovery?: string;
  messaging?: string;
  audience?: string;
  complete?: string;
  combined?: string;
}

// Type guard for checking if a phase exists in reports
export function isValidPhase(phase: string): phase is keyof Reports {
  return ['discovery', 'messaging', 'audience', 'complete', 'combined'].includes(phase);
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  phase: PhaseId;
}