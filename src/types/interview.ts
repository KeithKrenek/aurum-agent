// src/types/interview.ts

type InterviewPhase = 'brand-elements' | 'messaging' | 'audience' | 'complete';

export interface Interview {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: Date;
    lastUpdated: Date;
    currentPhase: InterviewPhase;
    threadId?: string;
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
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    hasCompletedInterview: boolean;
  }