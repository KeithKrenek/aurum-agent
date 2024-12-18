import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ProgressManager } from './ProgressManager';
import { Interview, Message } from './types/interview';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import PhaseProgress from './PhaseProgress';
import { config } from './config/environment';
import { PREDEFINED_QUESTIONS } from './types/constants';

const normalizeText = (text: string): string =>
  text.trim().toLowerCase().replace(/\s+/g, ' ');

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'discovery' | 'messaging' | 'audience' | 'complete'>('discovery');
  const [questionCount, setQuestionCount] = useState(0);
  const [reports, setReports] = useState<Interview['reports']>({});
  const [threadId, setThreadId] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const progressManager = useRef<ProgressManager | null>(null);
  const navigate = useNavigate();
  const { interviewId: urlInterviewId } = useParams<{ interviewId: string }>();
  const inputBoxRef = useRef<HTMLDivElement>(null);

  // Fallback to sessionStorage
  const interviewId = urlInterviewId || sessionStorage.getItem('interviewId');
 
  const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    dangerouslyAllowBrowser: true
  });

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!messageListRef.current) return;
    
    const scrollContainer = messageListRef.current;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    const maxScroll = scrollHeight - clientHeight;
    
    // Ensure we're only scrolling if we need to
    if (scrollContainer.scrollTop < maxScroll) {
      try {
        scrollContainer.scrollTo({
          top: scrollHeight,
          behavior,
        });
      } catch (error) {
        // Fallback for browsers that don't support smooth scrolling
        scrollContainer.scrollTop = scrollHeight;
      }
    }
  };
  
  // Remove all existing scroll-related useEffect hooks and replace with:
  
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    if (messages.length > 0 || isTyping) {
      // Wait for content to render and stabilize
      scrollTimeout = setTimeout(() => {
        scrollToBottom(isTyping ? 'smooth' : 'instant');
      }, 100);
    }
    
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [messages, isTyping]);

 

  const adjustMessageListPadding = () => {
    if (!inputBoxRef.current || !messageListRef.current) return;
    
    const inputHeight = inputBoxRef.current.offsetHeight;
    const padding = inputHeight + 20; // 20px extra space
    
    requestAnimationFrame(() => {
      if (messageListRef.current) {
        messageListRef.current.style.paddingBottom = `${padding}px`;
      }
    });
  };
  
  useEffect(() => {
    adjustMessageListPadding();
    
    // Add resize observer to handle dynamic input height changes
    const resizeObserver = new ResizeObserver(adjustMessageListPadding);
    
    if (inputBoxRef.current) {
      resizeObserver.observe(inputBoxRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Focus the textarea when the component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus the textarea when the Assistant stops typing
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);

  // Update question count based on Assistant messages
  const updateQuestionCount = (messages: Message[]) => {
    const askedQuestions = new Set<string>(); // Use a Set to track unique questions

    messages
      .filter(m => m.role === 'assistant') // Only process Assistant's messages
      .forEach(m => {
        const normalizedContent = normalizeText(m.content);
        PREDEFINED_QUESTIONS.forEach(q => {
          if (normalizedContent.includes(normalizeText(q))) {
            askedQuestions.add(q); // Add matched question to the Set
          }
        });
      });

    setQuestionCount(askedQuestions.size); // Update state with unique matches
  };

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
  // const handleActiveRuns = async (threadId: string) => {
  //   try {
  //     const runs = await openai.beta.threads.runs.list(threadId);
  //     const activeRuns = runs.data.filter(run => 
  //       ['in_progress', 'queued'].includes(run.status)
  //     );

  //     for (const run of activeRuns) {
  //       try {
  //         await openai.beta.threads.runs.cancel(threadId, run.id);
  //         await new Promise(resolve => setTimeout(resolve, 1000));
  //       } catch (error) {
  //         console.log(`Run ${run.id} already completed or cancelled`);
  //       }
  //     }

  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //   } catch (error) {
  //     console.error('Error handling active runs:', error);
  //     throw error;
  //   }
  // };

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
        let threadId = interviewData.threadId;

        // If no threadId exists, create a new OpenAI thread
        if (!threadId) {
            const newThread = await openai.beta.threads.create();
            threadId = newThread.id;

            // Update Firestore with the new threadId
            await updateDoc(doc(db, 'interviews', interviewId), {
                threadId: newThread.id,
                lastUpdated: new Date()
            });
        }

        // Set state values
        setThreadId(threadId);
        setMessages(interviewData.messages || []);
        setCurrentPhase(interviewData.currentPhase || 'discovery');
        updateQuestionCount(interviewData.messages || []);
        setReports(interviewData.reports || {});

        console.log('Firestore Interview Data:', {
          interviewId,
          threadId: interviewData.threadId
        });

        // Auto-start the conversation if no messages exist
        if (interviewData.messages.length === 0) {
            await startNewConversation(threadId);
        }
    } catch (error) {
        console.error('Error initializing chat:', error);
        toast.error('Failed to initialize chat. Please try again.');
        navigate('/');
    }
};

  // Start new conversation
  const startNewConversation = async (threadId: string) => {
    try {
      setIsTyping(true);
      
      await ensureNoActiveRuns(threadId);
      
      const brandName = sessionStorage.getItem('brandName');
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: `Please begin the brand development process for ${brandName}.`
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: config.openai.assistantId
      });
      
      // Use the existing helper function instead of manual status checking
      await waitForRunCompletion(threadId, run.id);
      
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
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation. Retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await startNewConversation(threadId); // Retry once
    } finally {
      setIsTyping(false);
    }
  };

  const parseAssistantResponse = (response: string) => {
    const reportRegex = /```markdown([\s\S]*?)```/g;
    let reportContents: string[] = [];
    let match;

    let remainingContent = response;

    // Extract all report blocks
    while ((match = reportRegex.exec(response)) !== null) {
        reportContents.push(match[1].trim());
        remainingContent = remainingContent.replace(match[0], '').trim(); // Remove matched block
    }

    // Add hyperlink to course mentions
    const courseRegex = /Brand Alchemy Mastery course|course/gi;
    const linkedContent = remainingContent.replace(courseRegex, 
      match => `<a href="www.elementsist.com/brandalchemymastery" target="_blank" class="text-dark-midnight hover:text-goldenrod underline">${match}</a>`
    );

    return {
      reportContents,
      remainingContent: linkedContent
    };
  };

  const processAssistantResponse = async (threadId: string) => {
    try {
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];

        if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
            const rawContent = lastMessage.content[0].text.value;

            // Parse response
            const { reportContents, remainingContent } = parseAssistantResponse(rawContent);

            // Handle multiple report contents
            for (const [index, reportContent] of reportContents.entries()) {
                console.log(`Report ${index + 1} detected, saving and skipping display.`);
                await handleReportGeneration(reportContent);
            }

            // Add remaining content to chat messages
            if (remainingContent) {
                const newMessage: Message = {
                    role: 'assistant',
                    content: remainingContent,
                    timestamp: new Date(),
                    phase: currentPhase
                };

                setMessages(prev => {
                    const updated = [...prev, newMessage];
                    updateQuestionCount(updated);
                    updateInterviewMessages(updated);
                    return updated;
                });
            }
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
    scrollToBottom('instant');  // Immediate scroll after user message
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // await handleActiveRuns(threadId);

      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage.content
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: config.openai.assistantId
      });

      await waitForRunCompletion(threadId, run.id);
      await processAssistantResponse(threadId);
      // setQuestionCount(prev => prev + 1);
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
    const phases = ['discovery', 'messaging', 'audience', 'complete'];
    const currentIndex = phases.indexOf(current);
    return phases[currentIndex + 1] as 'messaging' | 'audience' | 'complete' | null;
  };

  const handleReportGeneration = async (reportText: string) => {
    try {
      if (!interviewId) throw new Error('Interview ID not found');
      const interviewRef = doc(db, 'interviews', interviewId);
  
      // Fetch the current interview document
      const interviewDoc = await getDoc(interviewRef);
      if (!interviewDoc.exists()) throw new Error('Interview not found');
  
      const interviewData = interviewDoc.data() as Interview;
      const currentReports = interviewData.reports || {};
  
      // Save the report for the current phase
      const updatedReports = {
        ...currentReports,
        [currentPhase]: reportText,
      };

      // console.log(updatedReports);
  
      // Determine the next phase
      const nextPhase = getNextPhase(currentPhase);
  
      // Update Firestore with the new report and (if applicable) the next phase
      await updateDoc(interviewRef, {
        reports: updatedReports,
        currentPhase: nextPhase || 'complete',
        lastUpdated: new Date(),
      });
  
      // Update local state
      setReports(updatedReports);
      if (nextPhase) {
        setCurrentPhase(nextPhase);
        setQuestionCount(1); // Start the new phase with the first question completed
      } else {
        setCurrentPhase('complete');
        const finalMessage: Message = {
          role: 'assistant',
          content: 'All phases are complete. Please download your reports from the progress ribbon above.',
          timestamp: new Date(),
          phase: 'complete',
        };
        setMessages((prev) => [...prev, finalMessage]);
        await updateInterviewMessages([...messages, finalMessage]);
      }
  
      toast.success('Report generated and saved successfully!');
    } catch (error) {
      console.error('Error handling report generation:', error);
      toast.error('Failed to save report. Please try again.');
    }
  };
  

  useEffect(() => {
    if (!interviewId) {
        toast.error('Session expired. Please restart your brand development journey.');
        navigate('/');
        return;
    }

    progressManager.current = new ProgressManager();
    initializeChat();
  }, [interviewId]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <PhaseProgress 
        currentPhase={currentPhase}
        questionCount={questionCount}
        totalQuestions={PREDEFINED_QUESTIONS.length}
        reports={reports}
        brandName={sessionStorage.getItem('brandName') || ''}
      />
      
      <main className="flex-grow relative overflow-hidden bg-white-smoke mt-20">
        <div 
          ref={messageListRef} 
          className="absolute inset-0 overflow-y-auto px-6 pb-20 pt-20 space-y-4"
          style={{ 
            paddingBottom: `${inputBoxRef.current?.offsetHeight || 80}px`,
            paddingTop: '1rem'
          }}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isLast={index === messages.length - 1}
              brandName={sessionStorage.getItem('brandName') || ''}
              reportContent={reports.complete || null}
            />
          ))}
          {isTyping && (
            <div className="text-neutral-gray italic">
              Transforming...
            </div>
          )}
        </div>
      </main>
      
      <div ref={inputBoxRef} className="sticky bottom-0 w-full bg-white border-t border-neutral-gray">
        <MessageInput 
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          sendMessage={sendMessage}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
};

export default Chat;