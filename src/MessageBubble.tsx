// src/components/MessageBubble.tsx

import React from 'react';
import { motion } from 'framer-motion';
// import { Download } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { generatePDF } from './pdfGenerator';
import { Message } from './types/interview';
import { marked } from 'marked';

// Create a custom renderer
const renderer = new marked.Renderer();

// Override the line break behavior
renderer.br = () => '<br/><br/>';

// Apply the custom renderer to marked
marked.use({
  renderer,
  breaks: true, // Interpret single newlines as breaks
  gfm: true,    // Enable GitHub Flavored Markdown
});

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  brandName: string;
  reportContent: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  // const parsedContent = marked.parse(message.content);

  // Split content into paragraphs and render each separately
  const paragraphs = message.content.split('\n\n').filter(p => p.trim());
  

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mb-4 ${isAssistant ? 'text-left' : 'text-right'}`}
        >
          <div
            className={`inline-block max-w-[80%] p-4 rounded-lg ${
              isAssistant ? 'bg-bone text-dark-gray' : 'bg-dark-gray text-bone'
            }`}
            dangerouslySetInnerHTML={{ __html: marked.parse(paragraph) }}
          />
        </motion.div>
      ))}
    </>
  );
};

export default MessageBubble;