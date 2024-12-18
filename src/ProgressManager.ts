// src/ProgressManager.ts

import { PhaseId } from './types/interview';

interface PhaseConfig {
  id: PhaseId;
  label: string;
  subPhases: number;
  reportRequired: boolean;
}

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

  private calculateProgress(currentPhase: PhaseId, questionCount: number): number {
    const phaseIndex = this.phases.findIndex(p => p.id === currentPhase);
    if (phaseIndex === -1) return 100;

    const completedPhasesProgress = (phaseIndex * 100) / this.phases.length;
    const currentPhaseProgress = (questionCount / this.phases[phaseIndex].subPhases) * (100 / this.phases.length);

    return Math.min(completedPhasesProgress + currentPhaseProgress, 100);
  }

  public getProgressData(currentPhase: PhaseId, questionCount: number) {
    const phaseIndex = this.phases.findIndex(p => p.id === currentPhase);
    
    return {
      totalProgress: this.calculateProgress(currentPhase, questionCount),
      phases: this.phases.map((phase, index) => ({
        ...phase,
        status: index < phaseIndex ? 'completed' : 
                index === phaseIndex ? 'active' : 'pending',
        progress: index < phaseIndex ? 100 :
                 index === phaseIndex ? (questionCount / phase.subPhases) * 100 : 0
      })),
      currentSubPhase: questionCount,
      isComplete: currentPhase === 'complete'
    };
  }
}