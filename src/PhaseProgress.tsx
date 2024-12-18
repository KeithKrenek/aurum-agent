import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, Loader } from 'lucide-react';
import { generatePDF } from './pdfGenerator';
import toast from 'react-hot-toast';

const PHASE_QUESTIONS = {
  'brand-elements': 3,
  'messaging': 3,
  'audience': 3,
  'complete': 0
};

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

  // Function to handle report download
  const handleDownload = async (phaseId: string, phaseLabel: string) => {
    const normalizedPhaseId = phaseId.replace('-', '');

    if (!reports[normalizedPhaseId]) {
      console.error(`No report found for phase: ${phaseId}`);
      toast.error(`No report available for ${phaseLabel}.`);
      return;
    }

    try {
      setDownloadingPhase(phaseId);
      await generatePDF({
        brandName,
        reportParts: [reports[normalizedPhaseId]],
        phaseName: phaseLabel
      });
      toast.success(`${phaseLabel} report downloaded successfully`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloadingPhase(null);
    }
  };

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);
  const isComplete = currentPhase === 'complete';
  const totalQuestionsInCurrentPhase = PHASE_QUESTIONS[currentPhase] || 1;
  const percentage = Math.min((questionCount / totalQuestionsInCurrentPhase) * 100, 100);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between mb-2">
          {phases.map((phase, index) => {
            const isCurrentPhase = index === currentPhaseIndex;
            const isCompleted = isComplete || index < currentPhaseIndex;
            const normalizedPhaseId = phase.id.replace('-', '');
            const hasReport = reports[normalizedPhaseId];

            return (
              <div key={phase.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                    isCompleted ? 'border-desert-sand text-desert-sand' : 'border-neutral-gray text-neutral-gray'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                {hasReport ? (
                  <button
                    onClick={() => handleDownload(phase.id, phase.label)}
                    disabled={downloadingPhase === phase.id}
                    className="text-sm font-semibold text-black hover:text-desert-sand"
                  >
                    {downloadingPhase === phase.id ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <>{phase.label} Report</>
                    )}
                  </button>
                ) : (
                  <span className={`text-sm ${isCurrentPhase ? 'font-semibold' : 'text-neutral-gray'}`}>
                    {phase.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative pt-1">
          <motion.div
            className={`h-2 rounded-full bg-desert-sand`}
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
