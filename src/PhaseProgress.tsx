// src/PhaseProgress.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check, Loader } from 'lucide-react';
import { generatePDF } from './pdfGenerator';
import toast from 'react-hot-toast';
import { PhaseId, Reports, isValidPhase } from './types/interview';
import { PhaseConfig } from './ProgressManager';
import { PREDEFINED_QUESTIONS } from './types/constants';


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

  const phases: PhaseConfig[] = [
    {
      id: 'discovery',
      label: 'Discovery',
      subPhases: 3,
      reportRequired: true,
    },
    {
      id: 'messaging',
      label: 'Messaging',
      subPhases: 3,
      reportRequired: true,
    },
    {
      id: 'audience',
      label: 'Audience',
      subPhases: 3,
      reportRequired: true,
    },
  ];  

  // const hasReport = (phaseId: string): boolean => {
  //   return Boolean(reports && reports[phaseId]);
  // };

  const handleDownload = async (phaseId: 'combined') => {
    const requiredReports = ['discovery', 'messaging', 'audience'] as const;
    
    const missingReports = requiredReports.filter(phase => {
      if (isValidPhase(phase)) {
        return !reports[phase];
      }
      return true;
    });
    
    if (missingReports.length > 0) {
      toast.error('Some reports are not yet available.');
      return;
    }
  
    try {
      setDownloadingPhase(phaseId);
      const combinedReports = requiredReports.map(phase => {
        if (isValidPhase(phase) && reports[phase]) {
          return reports[phase]!;
        }
        throw new Error('Invalid phase or missing report');
      });
      
      await generatePDF({
        brandName,
        reportParts: combinedReports,
        phaseName: 'Brand Spark Analysis'
      });
      toast.success('Complete brand report downloaded successfully.');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloadingPhase(null);
    }
  };

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);
  // const progress = calculateProgress(phases, currentPhase, questionCount);
  const totalQuestions = PREDEFINED_QUESTIONS.length;
  const progressPercentage = ((questionCount) / totalQuestions) * 100;

  // console.log('Current phase:', currentPhase);
  // console.log('Current phase index:', currentPhaseIndex);
  // console.log('Question:', questionCount);
  // console.log('Progress:', progressPercentage);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between mb-2">
          {phases.map((phase, index) => {
            const isCompleted = currentPhase === 'complete' || index < currentPhaseIndex;
            const isCurrentPhase = index === currentPhaseIndex;
  
            return (
              <div key={phase.id} className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                  isCompleted ? 'border-desert-sand text-desert-sand' : 'border-neutral-gray text-neutral-gray'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                <span className={`text-sm ${isCurrentPhase ? 'font-semibold' : 'text-neutral-gray'}`}>
                  {phase.label}
                </span>
              </div>
            );
          })}
          
          {/* Add final report download button */}
          {currentPhase === 'complete' && (
            <button
              onClick={() => handleDownload('combined')}
              disabled={downloadingPhase === 'combined'}
              className="ml-4 px-4 py-2 bg-desert-sand text-dark-gray rounded-lg hover:bg-champagne transition-colors"
            >
              {downloadingPhase === 'combined' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Brand Spark Report
                </span>
              )}
            </button>
          )}
        </div>
        
        <div className="relative pt-1">
          <motion.div
            className="h-2 rounded-full bg-desert-sand"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhaseProgress;