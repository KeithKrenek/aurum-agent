// src/types/interview.ts

type InterviewPhase = 'brand-elements' | 'messaging' | 'audience' | 'complete';

export interface Interview {
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  lastUpdated: Date;
  currentPhase: InterviewPhase;
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
    phase: InterviewPhase;
  }
  
  export interface User {
    name: string;
    email: string;
    createdAt: Date;
  }