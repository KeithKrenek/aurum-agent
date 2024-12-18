// src/components/MessageBubble.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePDF } from './pdfGenerator';
import { Message } from './types/interview';

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
    if (!reportContent) {
      toast.error('Report content is not available.');
      return;
    }

    try {
      const normalizedPhase = message.phase.replace(/-([a-z])/g, (_, letter) => 
        letter.toUpperCase()
      );
      
      await generatePDF({
        brandName,
        reportParts: [reportContent],
        phaseName: message.phase === 'complete' ? 'Final Report' : 
          normalizedPhase.replace(/([A-Z])/g, ' $1').trim()
      });
      
      toast.success(`${message.phase === 'complete' ? 'Final report' : 
        normalizedPhase + ' report'} downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to download report. Please try again.');
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
        {message.phase === 'complete' && reportContent ? (
          <div className="flex flex-col gap-2">
            <div className="prose prose-sm mb-2">
              {message.content}
            </div>
            <button
              onClick={handleDownloadFinalReport}
              className="flex items-center gap-2 px-4 py-2 bg-dark-gray text-white rounded hover:bg-black transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Final Report
            </button>
          </div>
        ) : (
          <div
            className="prose prose-sm"
            dangerouslySetInnerHTML={{
              __html: message.content
                .replace(/([^?.!]*\?)/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;