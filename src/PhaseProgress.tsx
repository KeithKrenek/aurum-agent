import React from 'react';
import { motion } from 'framer-motion';

interface PhaseProgressProps {
  currentPhase: 'brand-elements' | 'messaging' | 'audience' | 'complete';
  questionCount: number;
  totalQuestions: number;
}

const PhaseProgress: React.FC<PhaseProgressProps> = ({ 
  currentPhase, 
  questionCount, 
  totalQuestions 
}) => {
  const phases = [
    { id: 'brand-elements', label: 'Brand Elements' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'audience', label: 'Audience' }
  ];

  const currentPhaseIndex = phases.findIndex(phase => phase.id === currentPhase);
  const isComplete = currentPhase === 'complete';
  const percentage = isComplete ? 100 : (questionCount / totalQuestions) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {phases.map((phase, index) => (
          <div 
            key={phase.id} 
            className={`flex flex-col items-center ${
              isComplete ? 'text-desert-sand' :
              index === currentPhaseIndex 
                ? 'text-black' 
                : index < currentPhaseIndex 
                  ? 'text-desert-sand' 
                  : 'text-neutral-gray'
            }`}
          >
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
              isComplete && 'border-desert-sand'
            }`}>
              {isComplete || index < currentPhaseIndex ? (
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium">{phase.label}</span>
          </div>
        ))}
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
  );
};

export default PhaseProgress;