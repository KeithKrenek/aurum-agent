import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Interview, Message } from './types/interview';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import PhaseProgress from './PhaseProgress';
import { config } from './config/environment';
import { generatePDF } from './pdfGenerator';

const PHASE_QUESTIONS = {
  'brand-elements': 3,
  'messaging': 3,
  'audience': 3,
  'complete': 0
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'brand-elements' | 'messaging' | 'audience' | 'complete'>('brand-elements');
  const [questionCount, setQuestionCount] = useState(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { interviewId } = useParams<{ interviewId: string }>();

  const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
  });

  // Helper function to manage run status
  const waitForRunCompletion = async (threadId: string, runId: string, maxAttempts = 30) => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (runStatus.status === 'completed') {
        return true;
      }
      
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`Run ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Run timed out');
  };

  // Helper function to manage active runs
  const handleActiveRuns = async (threadId: string) => {
    try {
      const runs = await openai.beta.threads.runs.list(threadId);
      const activeRuns = runs.data.filter(run => 
        ['in_progress', 'queued'].includes(run.status)
      );

      for (const run of activeRuns) {
        try {
          await openai.beta.threads.runs.cancel(threadId, run.id);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`Run ${run.id} already completed or cancelled`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error handling active runs:', error);
      throw error;
    }
  };

  // Helper function to check run status
  const checkRunStatus = async (threadId: string, runId: string) => {
    try {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
      return runStatus.status;
    } catch (error) {
      console.error('Error checking run status:', error);
      return 'failed';
    }
  };

  // Helper function to cancel a run
  const cancelRun = async (threadId: string, runId: string) => {
    try {
      await openai.beta.threads.runs.cancel(threadId, runId);
      
      // Wait and verify the cancellation
      let status;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await checkRunStatus(threadId, runId);
      } while (status === 'cancelling');
      
    } catch (error) {
      // If we get a 'not found' or 'already cancelled' error, that's fine
      console.log('Run already completed or cancelled');
    }
  };

  // Helper function to ensure no active runs
  const ensureNoActiveRuns = async (threadId: string) => {
    try {
      const runs = await openai.beta.threads.runs.list(threadId);
      const activeRuns = runs.data.filter(run => 
        ['in_progress', 'queued', 'cancelling'].includes(run.status)
      );
      
      // Cancel all active runs sequentially
      for (const run of activeRuns) {
        await cancelRun(threadId, run.id);
      }
      
      // Add a small delay after cancelling all runs
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error managing active runs:', error);
      throw error;
    }
  };

  // Initialize chat session
  const initializeChat = async () => {
    if (!interviewId) {
      navigate('/');
      return;
    }

    try {
      const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
      if (!interviewDoc.exists()) {
        throw new Error('Interview not found');
      }

      const interviewData = interviewDoc.data() as Interview;
      setMessages(interviewData.messages || []);
      setCurrentPhase(interviewData.currentPhase || 'brand-elements');
      setThreadId(interviewData.threadId);
      setQuestionCount(interviewData.messages?.filter(m => m.role === 'user').length || 0);

      if (interviewData.messages.length === 0) {
        await startNewConversation(interviewData.threadId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load interview. Please try again.');
      navigate('/');
    }
  };

  // Start new conversation
  const startNewConversation = async (threadId: string) => {
    try {
      setIsTyping(true);
      
      // First, ensure no active runs
      await ensureNoActiveRuns(threadId);
      
      // Create the initial message
      const brandName = sessionStorage.getItem('brandName');
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: `Hello, I'm ready to begin the brand development process for ${brandName}.`
      });
      
      // Wait a moment before creating the run
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create and monitor the run
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: config.openai.assistantId
      });
      
      let runStatus;
      let attempts = 0;
      const maxAttempts = 30;
      
      do {
        if (attempts >= maxAttempts) {
          throw new Error('Run timed out');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await checkRunStatus(threadId, run.id);
        attempts++;
        
      } while (runStatus === 'in_progress' || runStatus === 'queued');
      
      if (runStatus === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        
        if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
          const newMessage: Message = {
            role: 'assistant',
            content: lastMessage.content[0].text.value,
            timestamp: new Date(),
            phase: currentPhase
          };
          setMessages([newMessage]);
          await updateInterviewMessages([newMessage]);
        }
      } else {
        throw new Error(`Run failed with status: ${runStatus}`);
      }
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation. Retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await startNewConversation(threadId); // Retry once
    } finally {
      setIsTyping(false);
    }
  };

  // Process assistant response
  const processAssistantResponse = async (threadId: string) => {
    try {
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const newMessage: Message = {
          role: 'assistant',
          content: lastMessage.content[0].text.value,
          timestamp: new Date(),
          phase: currentPhase
        };

        if (lastMessage.content[0].text.value.includes('# Brand')) {
          await handleReportGeneration(lastMessage.content[0].text.value);
        }

        setMessages(prev => {
          const updated = [...prev, newMessage];
          updateInterviewMessages(updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error processing assistant response:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !threadId || !interviewId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      phase: currentPhase
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      await handleActiveRuns(threadId);

      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage.content
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: config.openai.assistantId
      });

      await waitForRunCompletion(threadId, run.id);
      await processAssistantResponse(threadId);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Update interview messages in Firestore
  const updateInterviewMessages = async (newMessages: Message[]) => {
    if (interviewId) {
      try {
        await updateDoc(doc(db, 'interviews', interviewId), {
          messages: newMessages,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error updating messages:', error);
        toast.error('Failed to save message history.');
      }
    }
  };

  const getNextPhase = (current: string): 'messaging' | 'audience' | 'complete' | null => {
    const phases = ['brand-elements', 'messaging', 'audience', 'complete'];
    const currentIndex = phases.indexOf(current);
    return phases[currentIndex + 1] as 'messaging' | 'audience' | 'complete' | null;
  };

const handleReportGeneration = async (reportText: string) => {
    try {
      // Get the stored brand name
      const brandName = sessionStorage.getItem('brandName');
      if (!brandName) {
        throw new Error('Brand name not found');
      }
  
      // Save report to Firebase
      await updateDoc(doc(db, 'interviews', interviewId!), {
        [`reports.${currentPhase}`]: reportText,
        lastUpdated: new Date()
      });
  
      // Generate PDF for the current phase
      await generatePDF({
        brandName,
        reportParts: [reportText]
      });
  
      // Handle phase transition
      const nextPhase = getNextPhase(currentPhase);
      if (nextPhase) {
        setCurrentPhase(nextPhase);
        await updateDoc(doc(db, 'interviews', interviewId!), {
          currentPhase: nextPhase
        });
      } else {
        // For final report, combine all phase reports
        const interviewDoc = await getDoc(doc(db, 'interviews', interviewId!));
        const interview = interviewDoc.data() as Interview;
        
        // Generate comprehensive final report
        await generatePDF({
          brandName,
          reportParts: [
            interview.reports.brandElements,
            interview.reports.messaging,
            interview.reports.audience,
            reportText // Include final summary
          ].filter(Boolean)
        });
  
        // Mark interview as complete
        await updateDoc(doc(db, 'interviews', interviewId!), {
          currentPhase: 'complete',
          lastUpdated: new Date()
        });
        
        toast.success('Brand development journey completed! Your report has been generated.');
        navigate('/');
      }
    } catch (error) {
      console.error('Error handling report:', error);
      toast.error('Failed to generate report. Please try again.');
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <main className="flex-grow overflow-hidden p-6 bg-white-smoke">
        <div className="mb-4">
          <PhaseProgress 
            currentPhase={currentPhase} 
            questionCount={questionCount} 
            totalQuestions={PHASE_QUESTIONS[currentPhase]} 
          />
        </div>
        <div ref={messageListRef} className="h-full overflow-y-auto pr-4 pb-4 space-y-4">
          {messages.map((message, index) => (
            <MessageBubble 
              key={index} 
              message={message} 
              isLast={index === messages.length - 1} 
            />
          ))}
          {isTyping && (
            <div className="text-neutral-gray italic">
              Assistant is typing...
            </div>
          )}
        </div>
      </main>
      <MessageInput 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        sendMessage={sendMessage}
        inputRef={inputRef}
      />
    </div>
  );
};

export default Chat;