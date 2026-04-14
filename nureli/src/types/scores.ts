export type ScoreStatus =
  | 'Strong Support'
  | 'Balanced'
  | 'Moderate'
  | 'Needs Attention'
  | 'Low Support'
  | 'Unclear';

export type NutrientKey =
  | 'ironSupport'
  | 'vitaminB12Support'
  | 'vitaminDSupport'
  | 'vitaminASupport'
  | 'folateSupport'
  | 'zincSupport'
  | 'proteinSupport'
  | 'hydrationSupport'
  | 'vitaminCSupport'
  | 'omega3Support'
  | 'dietQualitySupport';

export interface NutrientScore {
  score: number;          // 0-100
  status: ScoreStatus;
  explanation: string;
}

export type NutrientScores = Record<NutrientKey, NutrientScore>;

export interface FocusArea {
  nutrient: NutrientKey;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  category: 'food' | 'habit' | 'lifestyle';
  title: string;
  description: string;
  icon: string;
}

export interface ScanResult {
  overallBalanceScore: number;
  nutrientScores: NutrientScores;
  focusAreas: FocusArea[];
  recommendations: Recommendation[];
  confidenceNote: string;
}
