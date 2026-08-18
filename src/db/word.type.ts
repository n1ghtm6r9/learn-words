import type { WordStage } from './wordStage.type';
import type { LearningPhase } from './learningPhase.type';

export interface Word {
  id?: number;
  term: string;
  translation: string;
  createdAt: number;

  stage: WordStage;

  learningPhase: LearningPhase;
  phaseStreak: number;

  rating: number;
  reviewStreak: number;

  lastReviewedAt?: number;
}
