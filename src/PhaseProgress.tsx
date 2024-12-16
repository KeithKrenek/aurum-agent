import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, Loader } from 'lucide-react';
import { generatePDF } from './pdfGenerator';
import toast from 'react-hot-toast';

interface PhaseProgressProps {
  currentPhase: 'brand-elements' | 'messaging' | 'audience' | 'complete';
  questionCount: number;
  totalQuestions: number;
  reports: {
    brandElements?: string;
    messaging?: string;
    audience?: string;
  };
  brandName: string;
}

const PhaseProgress: React.FC<PhaseProgressProps> = ({ 
  currentPhase, 
  questionCount, 
  totalQuestions,
  reports,
  brandName
}) => {
  const [downloadingPhase, setDownloadingPhase] = useState<string | null>(null);

  const phases = [
    { id: 'brand-elements', label: 'Brand Elements' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'audience', label: 'Audience' }
  ];

  const handleDownload = async (phaseId: string) => {
    if (!reports[phaseId]) return;

    try {
      setDownloadingPhase(phaseId);
      await generatePDF({
        brandName,
        reportParts: [reports[phaseId]]
      });
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloadingPhase(null);
    }
  };

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);
  const isComplete = currentPhase === 'complete';
  const percentage = isComplete ? 100 : (questionCount / totalQuestions) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between mb-2">
          {phases.map((phase, index) => {
            const isCurrentPhase = index === currentPhaseIndex;
            const isCompleted = isComplete || index < currentPhaseIndex;
            const hasReport = reports[phase.id];
            
            return (
              <div 
                key={phase.id} 
                className={`flex flex-col items-center ${
                  isComplete ? 'text-desert-sand' :
                  isCurrentPhase ? 'text-black' : 
                  isCompleted ? 'text-desert-sand' : 
                  'text-neutral-gray'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                  isComplete && 'border-desert-sand'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {hasReport ? (
                  <button
                    onClick={() => handleDownload(phase.id)}
                    disabled={downloadingPhase !== null}
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    {phase.label}
                    {downloadingPhase === phase.id ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <span className="text-sm font-medium">{phase.label}</span>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="relative pt-1">
          <motion.div
            className={`h-2 rounded-full ${
              isComplete ? 'bg-desert-sand' : 'bg-desert-sand'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhaseProgress;