// src/PhaseProgress.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, Loader } from 'lucide-react';
import { generatePDF } from './pdfGenerator';
import toast from 'react-hot-toast';
import { PhaseId, Reports } from './types/interview';

const PHASE_QUESTIONS = {
  'discovery': 3,
  'messaging': 3,
  'audience': 3,
  'complete': 0
} as const;

interface PhaseProgressProps {
  currentPhase: PhaseId;
  questionCount: number;
  totalQuestions: number;
  reports: Reports;
  brandName: string;
}

const PhaseProgress: React.FC<PhaseProgressProps> = ({
  currentPhase,
  questionCount,
  reports,
  brandName
}) => {
  const [downloadingPhase, setDownloadingPhase] = useState<string | null>(null);

  const phases = [
    { id: 'discovery', label: 'Discovery' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'audience', label: 'Audience' }
  ];

  const hasReport = (phaseId: string): boolean => {
    return Boolean(reports && reports[phaseId]);
  };

  const handleDownload = async (phaseId: string, phaseLabel: string) => {
    
    if (!reports[phaseId]) {
      console.log(`No report found for ${phaseId}`);
      toast.error(`No report available for ${phaseLabel}.`);
      return;
    }

    try {
      setDownloadingPhase(phaseId);
      await generatePDF({
        brandName,
        reportParts: [reports[phaseId]!],
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

  const calculateProgress = (phase: PhaseId, count: number): number => {
    const phaseIndex = phases.findIndex(p => p.id === phase);
    if (phaseIndex === -1) return 100;
  
    const completedPhasesProgress = (phaseIndex * 100) / phases.length;
    const currentPhaseProgress = (count / PHASE_QUESTIONS[phase]) * (100 / phases.length);
  
    return Math.min(completedPhasesProgress + currentPhaseProgress, 100);
  };

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);
  const progress = calculateProgress(currentPhase, questionCount);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between mb-2">
          {phases.map((phase, index) => {
            const isCompleted = currentPhase === 'complete' || index < currentPhaseIndex;
            const isCurrentPhase = index === currentPhaseIndex;
            const reportAvailable = hasReport(phase.id);

            return (
              <div key={phase.id} className="flex flex-col items-center text-center">
                {/* Phase circle indicator rendered above the title */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                  isCompleted ? 'border-desert-sand text-desert-sand' : 'border-neutral-gray text-neutral-gray'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                
                {/* Conditional rendering of either download button or static text */}
                {reportAvailable ? (
                  // Download button rendered when a report exists for this phase
                  <button
                    onClick={() => handleDownload(phase.id, phase.label)}
                    disabled={downloadingPhase === phase.id}
                    className="text-sm font-semibold text-black hover:text-desert-sand transition-colors"
                  >
                    {downloadingPhase === phase.id ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {phase.label} Report
                      </span>
                    )}
                  </button>
                ) : (
                  // Static text rendered when no report is available
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
            className="h-2 rounded-full bg-desert-sand"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhaseProgress;