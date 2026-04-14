import type { NutrientScores, FocusArea, Recommendation } from './scores';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageUrls {
  faceImageUrl: string;
  eyeImageUrl: string;
  handImageUrl: string;
}

export interface QuestionnairePayload {
  energyLevel: number;          // 1-5
  sleepQuality: number;         // 1-5
  dailyWaterIntake: number;     // 1-5
  sunlightExposure: number;     // 1-5
  foodPattern: 'vegetarian' | 'vegan' | 'mixed' | 'pescatarian';
  eggFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  dairyFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  leafyGreensFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  legumesFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  meatFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';
  mealRegularity: number;      // 1-5
  exerciseLevel: number;       // 1-5
  hairFall: boolean;
  skinDullness: boolean;
  weakness: boolean;
  concentrationIssues: boolean;
  appetite: number;            // 1-5
  stressLevel: number;         // 1-5
}

export interface Scan {
  id: string;
  userId: string;
  createdAt: string;
  status: ScanStatus;
  images: ImageUrls;
  questionnaire: QuestionnairePayload;
  aiRawResponse?: string;
  overallBalanceScore?: number;
  nutrientScores?: NutrientScores;
  focusAreas?: FocusArea[];
  recommendations?: Recommendation[];
  confidenceNote?: string;
  modelVersion?: string;
}
