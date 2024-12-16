import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import OpenAI from 'openai';
import { ChatManager } from './services/ChatManager';
import { ProgressManager } from './services/ProgressManager';
import { Interview, Message } from './types/interview';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import PhaseProgress from './PhaseProgress';
import { config } from './config/environment';
import toast from 'react-hot-toast';

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
  const [reports, setReports] = useState<Interview['reports']>({});
  
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatManager = useRef<ChatManager | null>(null);
  const progressManager = useRef<ProgressManager | null>(null);
  
  const navigate = useNavigate();
  const { interviewId } = useParams<{ interviewId: string }>();

  const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
  });

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
      chatManager.current = new ChatManager(openai, interviewData.threadId, interviewId);
      progressManager.current = new ProgressManager();

      setMessages(interviewData.messages || []);
      setCurrentPhase(interviewData.currentPhase || 'brand-elements');
      setReports(interviewData.reports || {});
      setQuestionCount(interviewData.messages?.filter(m => m.role === 'user').length || 0);

      // Start conversation if this is a new interview
      if (interviewData.messages.length === 0) {
        setIsTyping(true);
        try {
          const initialMessage = await chatManager.current.startNewConversation();
          if (initialMessage) {
            setMessages([initialMessage]);
          }
        } catch (error) {
          console.error('Error starting conversation:', error);
          toast.error('Failed to start conversation. Please try again.');
        } finally {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat. Please try again.');
      navigate('/');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatManager.current || !interviewId || isLoading) return;

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
      const response = await chatManager.current.sendMessage(userMessage, currentPhase);
      
      if (response) {
        setMessages(prev => [...prev, response]);
        setQuestionCount(prev => prev + 1);
        
        // Handle phase transition if a report was generated
        if (response.content.includes('# Brand')) {
          const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
          const interviewData = interviewDoc.data() as Interview;
          setReports(interviewData.reports || {});
          
          // Transition to next phase
          const nextPhase = getNextPhase(currentPhase);
          if (nextPhase) {
            setCurrentPhase(nextPhase);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const getNextPhase = (current: string): 'messaging' | 'audience' | 'complete' | null => {
    const phases = ['brand-elements', 'messaging', 'audience', 'complete'];
    const currentIndex = phases.indexOf(current);
    return phases[currentIndex + 1] as 'messaging' | 'audience' | 'complete' | null;
  };

  useEffect(() => {
    initializeChat();
  }, [interviewId]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);

  return (
    <div className="flex flex-col h-full bg-white">
      <PhaseProgress 
        currentPhase={currentPhase}
        questionCount={questionCount}
        totalQuestions={PHASE_QUESTIONS[currentPhase]}
        reports={reports}
        brandName={sessionStorage.getItem('brandName') || ''}
      />
      
      <main className="flex-grow overflow-hidden p-6 bg-white-smoke mt-20">
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
              Alchemy-ing...
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