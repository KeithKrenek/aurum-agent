// src/components/MessageBubble.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Message } from './types/interview';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const isAssistant = message.role === 'assistant';
  const formattedContent = isAssistant
    ? message.content.replace(/([^?.!]*\?)/g, '<strong>$1</strong>')
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-4 ${isAssistant ? 'text-left' : 'text-right'}`}
    >
      <div
        className={`inline-block max-w-[80%] p-4 rounded-lg ${
          isAssistant
            ? 'bg-bone text-dark-gray'
            : 'bg-dark-gray text-bone'
        } ${isLast && isAssistant ? 'animate-pulse' : ''}`}
      >
        <div
          className="prose prose-sm"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>
    </motion.div>
  );
};

export default MessageBubble;