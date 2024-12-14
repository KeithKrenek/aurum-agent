import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messageListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    const initializeChat = async () => {
      const userEmail = localStorage.getItem('email');
      const userName = localStorage.getItem('name');

      if (!userEmail || !userName) {
        toast.error('User details are missing. Redirecting to registration...');
        navigate('/auth');
        return;
      }

      try {
        const userRef = doc(db, 'users', userEmail);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          toast.error('User details not found. Redirecting to registration...');
          navigate('/auth');
          return;
        }

        console.log('Chat initialized for:', userName);
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast.error('Failed to initialize chat. Please try again.');
        navigate('/auth');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [navigate]);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      setIsTyping(true);

      await openai.beta.threads.messages.create({
        role: 'user',
        content: input,
      });

      const assistantResponse = await openai.beta.threads.runs.create({
        assistant_id: import.meta.env.VITE_OPENAI_ASSISTANT_ID,
      });

      const newMessage: Message = {
        role: 'assistant',
        content: assistantResponse.data.content,
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send your message. Please try again.');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      sendMessage();
    }
  };

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  if (isInitializing) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="flex-grow overflow-hidden p-6 bg-white-smoke">
        <div ref={messageListRef} className="h-full overflow-y-auto pr-4 pb-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
          </AnimatePresence>
          {isTyping && <div className="text-neutral-gray italic">Assistant is typing...</div>}
        </div>
      </main>
      <footer className="bg-white p-4 shadow-md">
        <div className="flex items-center max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow p-3 border border-neutral-gray rounded-l-lg focus:outline-none focus:ring-2 focus:ring-dark-gray resize-none h-24"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-dark-gray text-bone p-3 rounded-r-lg hover:bg-dark-gray transition duration-300 disabled:bg-neutral-gray focus:outline-none focus:ring-2 focus:ring-dark-gray h-24"
          >
            {isLoading ? <Loader className="animate-spin" /> : <Send />}
          </button>
        </div>
      </footer>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div
    className={`mb-4 ${
      message.role === 'user' ? 'text-right' : 'text-left'
    }`}
  >
    <span
      className={`inline-block p-3 rounded-lg ${
        message.role === 'user' ? 'bg-dark-gray text-bone' : 'bg-bone text-dark-gray'
      }`}
    >
      {message.content}
    </span>
  </div>
);

export default Chat;
