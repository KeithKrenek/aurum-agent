// src/types/interview.ts

export interface Interview {
  brandName: string;
  threadId: string;
  createdAt: Date;
  lastUpdated: Date;
  currentPhase: 'brand-elements' | 'messaging' | 'audience' | 'complete';
  messages: Message[];
  reports: {
    brandElements?: string;
    messaging?: string;
    audience?: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  phase: 'brand-elements' | 'messaging' | 'audience' | 'complete';
}