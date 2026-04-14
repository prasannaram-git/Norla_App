import type { NutrientKey, ScoreStatus } from '@/types/scores';

export const APP_NAME = 'Norla';
export const APP_TAGLINE = 'Smarter nutrition insight';
export const APP_DESCRIPTION =
  'AI-powered nutrition insight that helps you understand your predicted nutrition pattern through image analysis and lifestyle inputs.';

// Professional icon names (Lucide icon references — used in components)
export const NUTRIENT_CONFIG: Record<
  NutrientKey,
  { label: string; iconName: string; color: string; description: string }
> = {
  ironSupport: {
    label: 'Iron Support',
    iconName: 'droplets',
    color: '#059669',
    description: 'Predicted iron intake and absorption support based on your inputs.',
  },
  vitaminB12Support: {
    label: 'Vitamin B12',
    iconName: 'zap',
    color: '#6366F1',
    description: 'Predicted B12 pattern based on diet and lifestyle signals.',
  },
  vitaminDSupport: {
    label: 'Vitamin D',
    iconName: 'sun',
    color: '#D97706',
    description: 'Predicted vitamin D pattern from sunlight and dietary inputs.',
  },
  folateSupport: {
    label: 'Folate',
    iconName: 'leaf',
    color: '#10B981',
    description: 'Predicted folate pattern based on green vegetable and legume intake.',
  },
  proteinSupport: {
    label: 'Protein',
    iconName: 'dumbbell',
    color: '#0EA5E9',
    description: 'Predicted protein intake pattern from dietary frequency and sources.',
  },
  hydrationSupport: {
    label: 'Hydration',
    iconName: 'droplet',
    color: '#2563EB',
    description: 'Hydration pattern based on daily water intake and activity level.',
  },
  dietQualitySupport: {
    label: 'Diet Quality',
    iconName: 'utensils',
    color: '#8B5CF6',
    description: 'Overall dietary quality based on variety, regularity, and balance.',
  },
  vitaminASupport: {
    label: 'Vitamin A',
    iconName: 'eye',
    color: '#F59E0B',
    description: 'Predicted vitamin A status from eye clarity, skin texture, and dietary sources.',
  },
  zincSupport: {
    label: 'Zinc',
    iconName: 'shield',
    color: '#64748B',
    description: 'Predicted zinc pattern from nail condition, skin healing, and dietary intake.',
  },
  vitaminCSupport: {
    label: 'Vitamin C',
    iconName: 'citrus',
    color: '#F97316',
    description: 'Predicted vitamin C status from skin integrity, gum health, and cuticle condition.',
  },
  omega3Support: {
    label: 'Omega-3',
    iconName: 'fish',
    color: '#0891B2',
    description: 'Predicted omega-3 pattern from skin moisture, eye dryness, and hair condition.',
  },
};

export const STATUS_CONFIG: Record<
  ScoreStatus,
  { color: string; bgColor: string; textColor: string }
> = {
  'Strong Support': {
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.08)',
    textColor: '#047857',
  },
  Balanced: {
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    textColor: '#059669',
  },
  Moderate: {
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.08)',
    textColor: '#B45309',
  },
  'Needs Attention': {
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.06)',
    textColor: '#B91C1C',
  },
  'Low Support': {
    color: '#991B1B',
    bgColor: 'rgba(153, 27, 27, 0.06)',
    textColor: '#7F1D1D',
  },
  Unclear: {
    color: '#8D96A0',
    bgColor: 'rgba(141, 150, 160, 0.08)',
    textColor: '#636E7A',
  },
};

export const SCORE_THRESHOLDS: { min: number; status: ScoreStatus }[] = [
  { min: 80, status: 'Strong Support' },
  { min: 65, status: 'Balanced' },
  { min: 50, status: 'Moderate' },
  { min: 35, status: 'Needs Attention' },
  { min: 20, status: 'Low Support' },
  { min: 0, status: 'Unclear' },
];

export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};
