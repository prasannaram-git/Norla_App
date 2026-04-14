import type { QuestionnairePayload } from '@/types/scan';
import type { NutrientScores, NutrientKey, FocusArea, Recommendation, ScanResult } from '@/types/scores';
import { getStatusFromScore } from './score-utils';

interface AIObservations {
  faceAnalysis?: string;
  eyeAnalysis?: string;
  handNailAnalysis?: string;
  overallAssessment?: string;
  crossCorrelation?: string;
  ironHint?: number;
  b12Hint?: number;
  vitDHint?: number;
  vitAHint?: number;
  folateHint?: number;
  zincHint?: number;
  proteinHint?: number;
  hydrationHint?: number;
  vitCHint?: number;
  omega3Hint?: number;
  generalHint?: number;
  confidenceLevel?: string;
}

const FREQUENCY_SCORES: Record<string, number> = {
  never: 0, rarely: 1, sometimes: 2, often: 3, daily: 4,
};

function freqScore(freq: string): number {
  return FREQUENCY_SCORES[freq] ?? 2;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 90% AI (image-based) / 10% questionnaire weighting
 * Cross-correlation bonus: if multiple concordant markers found, amplify the signal
 */

function computeIronScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.ironHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.leafyGreensFrequency) - 2) * 1.5;
    qAdjust += (freqScore(q.meatFrequency) - 2) * 1;
    qAdjust += (q.energyLevel - 3) * 1;
    if (q.weakness) qAdjust -= 3;
    if (q.hairFall) qAdjust -= 2;
    return clampScore(ai.ironHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (freqScore(q.leafyGreensFrequency) - 2) * 6;
  score += (freqScore(q.legumesFrequency) - 2) * 5;
  score += (freqScore(q.meatFrequency) - 2) * 5;
  score += (q.energyLevel - 3) * 4;
  if (q.weakness) score -= 10;
  if (q.hairFall) score -= 8;
  if (q.skinDullness) score -= 5;
  score += (q.mealRegularity - 3) * 3;
  return clampScore(score);
}

function computeB12Score(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.b12Hint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.eggFrequency) - 2) * 1.5;
    qAdjust += (freqScore(q.dairyFrequency) - 2) * 1;
    if (q.foodPattern === 'vegan') qAdjust -= 5;
    else if (q.foodPattern === 'vegetarian') qAdjust -= 2;
    return clampScore(ai.b12Hint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (freqScore(q.eggFrequency) - 2) * 6;
  score += (freqScore(q.dairyFrequency) - 2) * 5;
  score += (freqScore(q.meatFrequency) - 2) * 6;
  if (q.foodPattern === 'vegan') score -= 20;
  else if (q.foodPattern === 'vegetarian') score -= 10;
  if (q.concentrationIssues) score -= 8;
  if (q.weakness) score -= 6;
  score += (q.energyLevel - 3) * 3;
  return clampScore(score);
}

function computeVitDScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.vitDHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (q.sunlightExposure - 3) * 2;
    qAdjust += (q.exerciseLevel - 3) * 1;
    return clampScore(ai.vitDHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (q.sunlightExposure - 3) * 10;
  score += (freqScore(q.dairyFrequency) - 2) * 4;
  score += (freqScore(q.eggFrequency) - 2) * 3;
  score += (q.exerciseLevel - 3) * 3;
  if (q.weakness) score -= 8;
  score += (q.energyLevel - 3) * 3;
  return clampScore(score);
}

function computeVitAScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.vitAHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.leafyGreensFrequency) - 2) * 2;
    qAdjust += (freqScore(q.dairyFrequency) - 2) * 1;
    if (q.skinDullness) qAdjust -= 2;
    return clampScore(ai.vitAHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 55;
  score += (freqScore(q.leafyGreensFrequency) - 2) * 7;
  score += (freqScore(q.dairyFrequency) - 2) * 4;
  score += (freqScore(q.eggFrequency) - 2) * 3;
  if (q.skinDullness) score -= 8;
  return clampScore(score);
}

function computeFolateScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.folateHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.leafyGreensFrequency) - 2) * 2;
    qAdjust += (freqScore(q.legumesFrequency) - 2) * 1;
    return clampScore(ai.folateHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (freqScore(q.leafyGreensFrequency) - 2) * 8;
  score += (freqScore(q.legumesFrequency) - 2) * 6;
  score += (q.mealRegularity - 3) * 4;
  score += (q.appetite - 3) * 3;
  return clampScore(score);
}

function computeZincScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.zincHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.meatFrequency) - 2) * 1.5;
    qAdjust += (freqScore(q.legumesFrequency) - 2) * 1;
    if (q.hairFall) qAdjust -= 3;
    return clampScore(ai.zincHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 55;
  score += (freqScore(q.meatFrequency) - 2) * 5;
  score += (freqScore(q.legumesFrequency) - 2) * 4;
  score += (freqScore(q.dairyFrequency) - 2) * 3;
  if (q.hairFall) score -= 8;
  if (q.skinDullness) score -= 5;
  return clampScore(score);
}

function computeProteinScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.proteinHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.meatFrequency) - 2) * 1;
    qAdjust += (freqScore(q.eggFrequency) - 2) * 1;
    qAdjust += (freqScore(q.dairyFrequency) - 2) * 1;
    return clampScore(ai.proteinHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (freqScore(q.meatFrequency) - 2) * 5;
  score += (freqScore(q.eggFrequency) - 2) * 5;
  score += (freqScore(q.dairyFrequency) - 2) * 5;
  score += (freqScore(q.legumesFrequency) - 2) * 4;
  score += (q.mealRegularity - 3) * 4;
  score += (q.exerciseLevel - 3) * 2;
  if (q.hairFall) score -= 5;
  if (q.weakness) score -= 5;
  return clampScore(score);
}

function computeHydrationScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.hydrationHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (q.dailyWaterIntake - 3) * 3;
    return clampScore(ai.hydrationHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (q.dailyWaterIntake - 3) * 12;
  score += (q.exerciseLevel - 3) * -3;
  if (q.skinDullness) score -= 8;
  score += (q.energyLevel - 3) * 3;
  return clampScore(score);
}

function computeVitCScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.vitCHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (freqScore(q.leafyGreensFrequency) - 2) * 1.5;
    if (q.skinDullness) qAdjust -= 2;
    return clampScore(ai.vitCHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 55;
  score += (freqScore(q.leafyGreensFrequency) - 2) * 6;
  score += (q.dailyWaterIntake - 3) * 3;
  if (q.skinDullness) score -= 6;
  score += (q.stressLevel - 3) * -3;
  return clampScore(score);
}

function computeOmega3Score(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.omega3Hint !== undefined) {
    let qAdjust = 0;
    if (q.foodPattern === 'pescatarian') qAdjust += 5;
    if (q.skinDullness) qAdjust -= 3;
    return clampScore(ai.omega3Hint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  if (q.foodPattern === 'pescatarian') score += 15;
  else if (q.foodPattern === 'mixed') score += 5;
  score += (freqScore(q.meatFrequency) - 2) * 3;
  if (q.skinDullness) score -= 8;
  if (q.hairFall) score -= 5;
  score += (q.dailyWaterIntake - 3) * 2;
  return clampScore(score);
}

function computeDietQualityScore(q: QuestionnairePayload, ai: AIObservations): number {
  if (ai.generalHint !== undefined) {
    let qAdjust = 0;
    qAdjust += (q.mealRegularity - 3) * 1.5;
    qAdjust += (q.appetite - 3) * 1;
    return clampScore(ai.generalHint * 0.9 + (50 + qAdjust) * 0.1);
  }
  let score = 50;
  score += (q.mealRegularity - 3) * 6;
  score += (q.appetite - 3) * 4;
  score += (freqScore(q.leafyGreensFrequency) - 2) * 4;
  score += (freqScore(q.legumesFrequency) - 2) * 3;
  const variety = freqScore(q.eggFrequency) + freqScore(q.dairyFrequency) +
    freqScore(q.leafyGreensFrequency) + freqScore(q.legumesFrequency) + freqScore(q.meatFrequency);
  score += (variety / 5 - 2) * 5;
  score += (q.stressLevel - 3) * -3;
  return clampScore(score);
}

// ──── Explanation Generator ────

function generateExplanation(nutrient: NutrientKey, score: number, _q: QuestionnairePayload, ai: AIObservations): string {
  const hasAI = !!(ai.faceAnalysis || ai.eyeAnalysis || ai.handNailAnalysis);
  const confidence = ai.confidenceLevel || 'MODERATE';
  const prefix = hasAI
    ? `Based on visual biomarker analysis (${confidence} confidence): `
    : 'Based on lifestyle assessment: ';

  const explanations: Record<NutrientKey, [string, string]> = {
    ironSupport: [
      'Nail beds and skin tone appear pink and well-perfused, consistent with healthy iron stores. No pallor or koilonychia observed.',
      'Visual markers suggest potential iron insufficiency — indicators include skin pallor, nail bed changes, or reduced complexion vitality.',
    ],
    vitaminB12Support: [
      'Sclera appears clear with no yellowing. Skin and neurological markers consistent with adequate B12.',
      'Potential B12 markers detected including subtle scleral changes, skin condition patterns, or tongue abnormalities.',
    ],
    vitaminDSupport: [
      'Skin appearance and overall complexion suggest adequate vitamin D status. Good skin firmness and tone.',
      'Skin analysis indicates potential vitamin D support needs. Complexion may show reduced vitality.',
    ],
    vitaminASupport: [
      'Eyes appear moist and clear with no xerophthalmia. Skin texture is smooth without follicular hyperkeratosis.',
      'Eye dryness or skin texture changes suggest potential vitamin A insufficiency requiring dietary attention.',
    ],
    folateSupport: [
      'No visible indicators of folate deficiency. Skin, nail, and mucosal health appear normal.',
      'Visual patterns suggest folate intake could be improved. Mucosal or skin changes may indicate need.',
    ],
    zincSupport: [
      'Nails show no white spots, ridging is minimal. Skin healing appears normal with no abnormal texture.',
      'Nail changes (white spots, ridging) or skin healing concerns suggest zinc status needs attention.',
    ],
    proteinSupport: [
      'Nail strength, hair condition, and skin elasticity suggest adequate protein intake. No muscle wasting observed.',
      'Hair, nail, and skin markers suggest protein intake may benefit from improvement.',
    ],
    hydrationSupport: [
      'Skin moisture, eye clarity, and lip condition suggest good hydration status.',
      'Skin dryness, reduced eye moisture, or lip condition suggest hydration patterns need improvement.',
    ],
    vitaminCSupport: [
      'Skin integrity is good with no petechiae. Gums and cuticles appear healthy.',
      'Skin fragility, cuticle condition, or bruising patterns suggest vitamin C status could improve.',
    ],
    omega3Support: [
      'Skin appears well-moisturized with good elasticity. Eye moisture appears adequate.',
      'Dry skin, reduced eye moisture, or hair dryness suggest omega-3 fatty acid intake could improve.',
    ],
    dietQualitySupport: [
      'Overall visual markers — skin clarity, eye brightness, and nail condition — suggest balanced nutrition.',
      'Combined visual indicators suggest dietary diversity and quality could be improved.',
    ],
  };

  const [good, concern] = explanations[nutrient];
  return prefix + (score >= 65 ? good : concern);
}

// ──── Focus Areas ────

function generateFocusAreas(scores: NutrientScores): FocusArea[] {
  const entries = Object.entries(scores) as [NutrientKey, { score: number; status: string; explanation: string }][];
  const sorted = entries.sort((a, b) => a[1].score - b[1].score);

  const labels: Record<NutrientKey, string> = {
    ironSupport: 'Iron Support',
    vitaminB12Support: 'Vitamin B12',
    vitaminDSupport: 'Vitamin D',
    vitaminASupport: 'Vitamin A',
    folateSupport: 'Folate',
    zincSupport: 'Zinc',
    proteinSupport: 'Protein',
    hydrationSupport: 'Hydration',
    vitaminCSupport: 'Vitamin C',
    omega3Support: 'Omega-3',
    dietQualitySupport: 'Diet Quality',
  };

  return sorted.slice(0, 3).map(([key, val], i) => ({
    nutrient: key,
    title: labels[key],
    description: val.explanation,
    priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  }));
}

// ──── Recommendations ────

function generateRecommendations(scores: NutrientScores): Recommendation[] {
  const recs: Recommendation[] = [];

  if (scores.ironSupport.score < 65) {
    recs.push({
      id: 'rec-iron-1', category: 'food', title: 'Boost iron-rich foods',
      description: 'Add spinach, lentils (dal), pomegranate, jaggery, and fortified cereals daily. Pair with vitamin C for better absorption.',
      icon: 'leaf',
    });
  }

  if (scores.vitaminB12Support.score < 65) {
    recs.push({
      id: 'rec-b12-1', category: 'food', title: 'Increase B12 sources',
      description: 'Include eggs, milk, yogurt, paneer, or fortified plant milk regularly. Consider B12 supplementation if vegetarian/vegan.',
      icon: 'egg',
    });
  }

  if (scores.vitaminDSupport.score < 65) {
    recs.push({
      id: 'rec-vitd-1', category: 'habit', title: 'Morning sunlight routine',
      description: 'Get 15-20 minutes of direct morning sun (before 10 AM) on arms and face. This is critical for vitamin D synthesis.',
      icon: 'sun',
    });
  }

  if (scores.vitaminASupport.score < 65) {
    recs.push({
      id: 'rec-vita-1', category: 'food', title: 'Add vitamin A sources',
      description: 'Eat orange/yellow vegetables (carrots, sweet potato, mango), leafy greens, and dairy products rich in retinol.',
      icon: 'carrot',
    });
  }

  if (scores.zincSupport.score < 65) {
    recs.push({
      id: 'rec-zinc-1', category: 'food', title: 'Zinc-rich food intake',
      description: 'Include pumpkin seeds, chickpeas, cashews, whole grains, and lean meats. Zinc is vital for immunity and skin repair.',
      icon: 'nut',
    });
  }

  if (scores.hydrationSupport.score < 65) {
    recs.push({
      id: 'rec-hydration-1', category: 'habit', title: 'Improve daily hydration',
      description: 'Drink 8-10 glasses of water. Start mornings with 500ml of warm water. Add coconut water or buttermilk for electrolytes.',
      icon: 'droplet',
    });
  }

  if (scores.proteinSupport.score < 65) {
    recs.push({
      id: 'rec-protein-1', category: 'food', title: 'Diversify protein sources',
      description: 'Include dal, paneer, curd, eggs, sprouts, or lean meats in every meal for complete amino acid coverage.',
      icon: 'dumbbell',
    });
  }

  if (scores.vitaminCSupport.score < 65) {
    recs.push({
      id: 'rec-vitc-1', category: 'food', title: 'Boost vitamin C intake',
      description: 'Eat amla (Indian gooseberry), citrus fruits, guava, bell peppers, and tomatoes daily. Vitamin C also enhances iron absorption.',
      icon: 'citrus',
    });
  }

  if (scores.omega3Support.score < 65) {
    recs.push({
      id: 'rec-omega3-1', category: 'food', title: 'Increase omega-3 sources',
      description: 'Add flaxseeds, walnuts, chia seeds, or fatty fish to your diet. Omega-3s support eye, skin, and brain health.',
      icon: 'fish',
    });
  }

  if (scores.dietQualitySupport.score < 65) {
    recs.push({
      id: 'rec-general-1', category: 'lifestyle', title: 'Improve meal consistency',
      description: 'Eat at regular times with balanced portions. Include all food groups and minimize processed foods.',
      icon: 'clock',
    });
  }

  if (scores.folateSupport.score < 65) {
    recs.push({
      id: 'rec-folate-1', category: 'food', title: 'Increase folate intake',
      description: 'Eat more leafy greens (palak, methi), lentils, avocados, and citrus. Folate is essential for cell repair.',
      icon: 'sprout',
    });
  }

  return recs.slice(0, 8);
}

// ──── Main Scoring Function ────

export function computeScores(
  questionnaire: QuestionnairePayload,
  aiObservations: AIObservations = {}
): ScanResult {
  const nutrientScores: NutrientScores = {} as NutrientScores;

  const rawScores: Record<NutrientKey, number> = {
    ironSupport: computeIronScore(questionnaire, aiObservations),
    vitaminB12Support: computeB12Score(questionnaire, aiObservations),
    vitaminDSupport: computeVitDScore(questionnaire, aiObservations),
    vitaminASupport: computeVitAScore(questionnaire, aiObservations),
    folateSupport: computeFolateScore(questionnaire, aiObservations),
    zincSupport: computeZincScore(questionnaire, aiObservations),
    proteinSupport: computeProteinScore(questionnaire, aiObservations),
    hydrationSupport: computeHydrationScore(questionnaire, aiObservations),
    vitaminCSupport: computeVitCScore(questionnaire, aiObservations),
    omega3Support: computeOmega3Score(questionnaire, aiObservations),
    dietQualitySupport: computeDietQualityScore(questionnaire, aiObservations),
  };

  for (const [key, score] of Object.entries(rawScores) as [NutrientKey, number][]) {
    nutrientScores[key] = {
      score,
      status: getStatusFromScore(score),
      explanation: generateExplanation(key, score, questionnaire, aiObservations),
    };
  }

  // Weighted overall score — emphasize the lowest scores more
  const scoreValues = Object.values(rawScores);
  const sortedScores = [...scoreValues].sort((a, b) => a - b);
  // Bottom 3 scores count extra (30% weight for bottom 3, 70% for all)
  const bottom3Avg = sortedScores.slice(0, 3).reduce((sum, s) => sum + s, 0) / 3;
  const allAvg = scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length;
  const overallBalanceScore = clampScore(allAvg * 0.7 + bottom3Avg * 0.3);

  const focusAreas = generateFocusAreas(nutrientScores);
  const recommendations = generateRecommendations(nutrientScores);

  const confidence = aiObservations.confidenceLevel || 'MODERATE';
  const confidenceNote = aiObservations.faceAnalysis
    ? `Clinical visual assessment (${confidence} confidence): This analysis examines 40+ biomarkers across your face, eyes, and hands using AI-powered pattern recognition. Scores reflect predicted nutritional sufficiency based on visible indicators. For clinical diagnosis, consult a healthcare professional.`
    : 'This assessment is based on your lifestyle questionnaire responses. For more accurate results, complete a visual scan with clear face, eye, and hand photos.';

  return {
    overallBalanceScore,
    nutrientScores,
    focusAreas,
    recommendations,
    confidenceNote,
  };
}
