interface PhaseConfig {
    id: string;
    label: string;
    subPhases: number;
    reportRequired: boolean;
  }
  
  export class ProgressManager {
    private readonly phases: PhaseConfig[] = [
      {
        id: 'brand-elements',
        label: 'Brand Elements',
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
  
    private calculateProgress(currentPhase: string, questionCount: number): number {
      const phaseIndex = this.phases.findIndex(p => p.id === currentPhase);
      if (phaseIndex === -1) return 100; // Complete
  
      const completedPhases = phaseIndex;
      const currentPhaseProgress = questionCount / this.phases[phaseIndex].subPhases;
      
      const baseProgress = (completedPhases / this.phases.length) * 100;
      const currentProgress = (currentPhaseProgress / this.phases.length) * 100;
  
      return Math.min(Math.round((baseProgress + currentProgress) * 100) / 100, 100);
    }
  
    private getPhaseStatus(currentPhase: string, questionCount: number) {
      return this.phases.map(phase => {
        const isCurrentPhase = phase.id === currentPhase;
        const phaseIndex = this.phases.findIndex(p => p.id === phase.id);
        const currentPhaseIndex = this.phases.findIndex(p => p.id === currentPhase);
        
        return {
          ...phase,
          status: isCurrentPhase ? 'active' :
                  phaseIndex < currentPhaseIndex ? 'completed' : 'pending',
          progress: isCurrentPhase ? 
                   (questionCount / phase.subPhases) * 100 :
                   phaseIndex < currentPhaseIndex ? 100 : 0
        };
      });
    }
  
    public getProgressData(currentPhase: string, questionCount: number) {
      return {
        totalProgress: this.calculateProgress(currentPhase, questionCount),
        phases: this.getPhaseStatus(currentPhase, questionCount),
        currentSubPhase: questionCount,
        isComplete: currentPhase === 'complete'
      };
    }
  }