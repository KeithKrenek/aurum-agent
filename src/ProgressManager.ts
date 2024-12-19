// src/ProgressManager.ts

import { PhaseId } from './types/interview';
import { PREDEFINED_QUESTIONS } from './types/constants';

export interface PhaseConfig {
  id: PhaseId; // Unique identifier for the phase
  label: string; // Human-readable name
  subPhases: number; // Number of sub-phases
  reportRequired: boolean; // Whether a report is required for this phase
}

export const calculateProgress = (
  phases: PhaseConfig[],
  currentPhase: PhaseId,
  questionCount: number,
): number => {
  const phaseIndex = phases.findIndex(p => p.id === currentPhase);
  if (phaseIndex === -1) return 100;

  const completedPhasesProgress = (phaseIndex * 100) / phases.length;
  const currentPhaseProgress =
    questionCount === 0
      ? 0 // No progress in the new phase yet
      : (questionCount / phases[phaseIndex].subPhases) * (100 / phases.length);

  return Math.min(completedPhasesProgress + currentPhaseProgress, 100);
};

export class ProgressManager {
  private readonly phases: PhaseConfig[] = [
    {
      id: 'discovery',
      label: 'Discovery',
      subPhases: 3,
      reportRequired: true
    },
    {
      id: 'messaging',
      label: 'Messaging',
      subPhases: 3,
      reportRequired: true
    },
    {
      id: 'audience',
      label: 'Audience',
      subPhases: 3,
      reportRequired: true
    }
  ];

  public getProgressData(currentPhase: PhaseId, questionCount: number) {
    // const totalProgress = calculateProgress(this.phases, currentPhase, questionCount);
    const totalQuestions = PREDEFINED_QUESTIONS.length;
    const totalProgress = ((questionCount) / totalQuestions) * 100;

    return {
      totalProgress,
      phases: this.phases.map((phase, index) => ({
        ...phase,
        status: index < this.phases.findIndex(p => p.id === currentPhase) ? 'completed' :
                index === this.phases.findIndex(p => p.id === currentPhase) ? 'active' : 'pending',
        progress: totalProgress,
      })),
      currentSubPhase: questionCount,
      isComplete: currentPhase === 'complete',
    };
  }
}