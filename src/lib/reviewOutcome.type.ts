import type { WordStage } from '@/db/wordStage.type';
import type { LearningPhase } from '@/db/learningPhase.type';

export interface ReviewOutcome {
  rating: number;
  reviewStreak: number;
  lastReviewedAt: number;
  stage?: WordStage;
  learningPhase?: LearningPhase;
  phaseStreak?: number;
}
