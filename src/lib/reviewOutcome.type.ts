import type { WordStage } from '@/db/wordStage.type';
import type { LearningPhase } from '@/db/learningPhase.type';

export interface ReviewOutcome {
  stability: number;
  difficulty: number;
  reviewStreak: number;
  lastReviewedAt: number;
  stage?: WordStage;
  learningPhase?: LearningPhase;
  phaseStreak?: number;
}
