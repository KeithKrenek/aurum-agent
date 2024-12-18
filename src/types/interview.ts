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
  [key: string]: string | undefined;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  phase: PhaseId;
}