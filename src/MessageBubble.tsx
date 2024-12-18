// src/components/MessageBubble.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Message } from './types/interview';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePDF } from './pdfGenerator';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  brandName: string;
  reportContent: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLast,
  brandName,
  reportContent
}) => {
  const isAssistant = message.role === 'assistant';

  const handleDownloadFinalReport = async () => {
    if (!reportContent) return;

    try {
      await generatePDF({
        brandName,
        reportParts: [reportContent]
      });
      toast.success('Final report downloaded successfully!');
    } catch (error) {
      console.error('Error generating final report:', error);
      toast.error('Failed to download final report.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-4 ${isAssistant ? 'text-left' : 'text-right'}`}
    >
      <div
        className={`inline-block max-w-[80%] p-4 rounded-lg ${
          isAssistant ? 'bg-bone text-dark-gray' : 'bg-dark-gray text-bone'
        }`}
      >
        {message.phase === 'complete' ? (
          <button
            onClick={handleDownloadFinalReport}
            className="flex items-center gap-2 px-4 py-2 bg-dark-gray text-white rounded hover:bg-black transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Final Report
          </button>
        ) : (
          <div
            className="prose prose-sm"
            dangerouslySetInnerHTML={{
              __html: message.content.replace(/([^?.!]*\?)/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
