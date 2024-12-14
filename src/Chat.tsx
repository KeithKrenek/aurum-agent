import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
// import { Send, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Interview, Message } from './types/interview';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import PhaseProgress from './PhaseProgress';

const PHASE_QUESTIONS = {
  'brand-elements': 3,
  'messaging': 3,
  'audience': 3,
  'complete': 0
};

const Chat: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
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

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    initializeChat();
  }, []);

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
      setQuestionCount(interviewData.messages?.filter(m => m.role === 'user').length || 0);

      if (!interviewData.threadId) {
        const thread = await openai.beta.threads.create();
        await updateDoc(doc(db, 'interviews', interviewId), {
          threadId: thread.id
        });
        setThreadId(thread.id);
        await sendInitialMessage(thread.id);
      } else {
        setThreadId(interviewData.threadId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load interview. Please try again.');
      navigate('/');
    }
  };

  const sendInitialMessage = async (threadId: string) => {
    try {
      const message = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: "Hello, I'm ready to begin the brand development process."
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_BRAND_ASSISTANT_ID
      });

      await waitForResponse(threadId, run.id);
    } catch (error) {
      console.error('Error sending initial message:', error);
      throw error;
    }
  };

  const waitForResponse = async (threadId: string, runId: string) => {
    setIsTyping(true);
    try {
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        
        if (runStatus.status === 'failed') {
          throw new Error('Assistant run failed');
        }
      }

      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const newMessage: Message = {
          role: 'assistant',
          content: lastMessage.content[0].text.value,
          timestamp: new Date(),
          phase: currentPhase
        };

        setMessages(prev => {
          const updated = [...prev, newMessage];
          updateInterviewMessages(updated);
          return updated;
        });

        // Check if the message contains a report
        if (lastMessage.content[0].text.value.includes('# Brand')) {
          await handleReportGeneration(lastMessage.content[0].text.value);
        }
      }
    } catch (error) {
      console.error('Error waiting for response:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleReportGeneration = async (reportText: string) => {
    try {
        await updateDoc(doc(db, 'interviews', interviewId!), {
            [`reports.${currentPhase}`]: reportText
        });

        const nextPhase = getNextPhase(currentPhase);
        if (nextPhase) {
            setCurrentPhase(nextPhase);
            await updateDoc(doc(db, 'interviews', interviewId!), {
                currentPhase: nextPhase
            });
        } else {
            // Mark interview as complete
            await updateDoc(doc(db, 'interviews', interviewId!), {
                currentPhase: 'complete',
                completedAt: new Date()
            });
            navigate(`/report/${interviewId}`);
        }
    } catch (error) {
        console.error('Error handling report:', error);
        toast.error('Failed to save report. Please try again.');
    }
    };

  const getNextPhase = (current: string): 'messaging' | 'audience' | 'complete' | null => {
    const phases = ['brand-elements', 'messaging', 'audience', 'complete'];
    const currentIndex = phases.indexOf(current);
    return phases[currentIndex + 1] as 'messaging' | 'audience' | 'complete' | null;
  };

  const sendMessage = async () => {
    if (!input.trim() || !threadId || !interviewId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      phase: currentPhase
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: input
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_OPENAI_ASSISTANT_ID
      });

      await waitForResponse(threadId, run.id);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col h-full bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex-grow overflow-hidden p-6 bg-white-smoke">
        <div className="mb-4">
          <PhaseProgress 
            currentPhase={currentPhase} 
            questionCount={questionCount} 
            totalQuestions={PHASE_QUESTIONS[currentPhase]} 
          />
        </div>
        <div ref={messageListRef} className="h-full overflow-y-auto pr-4 pb-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                isLast={index === messages.length - 1} 
              />
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-neutral-gray italic"
            >
              Assistant is typing...
            </motion.div>
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