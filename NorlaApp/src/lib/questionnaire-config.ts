// ── Questionnaire Config — EXACT COPY from web app's scoring engine ──
// Field names MUST match QuestionnairePayload in nureli/src/types/scan.ts
// The scoring engine reads these exact field names to compute nutrient scores.

export interface QuestionConfig {
  id: string;
  category?: string;
  question: string;
  type: 'slider' | 'select' | 'pills' | 'toggle';
  field: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  labels?: [string, string];
  description?: string;
}

export interface StepConfig {
  title: string;
  subtitle: string;
  questions: QuestionConfig[];
}

export const QUESTIONNAIRE_STEPS: StepConfig[] = [
  {
    title: 'Energy & Sleep',
    subtitle: 'How are your energy levels and rest?',
    questions: [
      {
        id: 'q1', category: 'energy',
        question: 'How would you rate your daily energy level?',
        type: 'slider', field: 'energyLevel', min: 1, max: 5,
        labels: ['Very Low', 'Very High'],
        description: 'Consider your typical energy throughout the day.',
      },
      {
        id: 'q2', category: 'sleep',
        question: 'How is your sleep quality?',
        type: 'slider', field: 'sleepQuality', min: 1, max: 5,
        labels: ['Poor', 'Excellent'],
        description: 'Think about how rested you feel each morning.',
      },
      {
        id: 'q3', category: 'stress',
        question: 'What is your general stress level?',
        type: 'slider', field: 'stressLevel', min: 1, max: 5,
        labels: ['Very Low', 'Very High'],
      },
    ],
  },
  {
    title: 'Hydration & Sun',
    subtitle: 'Water intake and sun exposure patterns',
    questions: [
      {
        id: 'q4', category: 'hydration',
        question: 'How much water do you drink daily?',
        type: 'slider', field: 'dailyWaterIntake', min: 1, max: 5,
        labels: ['Very Little', 'Plenty'],
        description: 'Include water, herbal teas, and water-rich foods.',
      },
      {
        id: 'q5', category: 'sunlight',
        question: 'How much sunlight do you get daily?',
        type: 'slider', field: 'sunlightExposure', min: 1, max: 5,
        labels: ['Almost None', 'Lots'],
        description: 'Natural outdoor sunlight, not through windows.',
      },
    ],
  },
  {
    title: 'Diet Pattern',
    subtitle: 'Tell us about your eating habits',
    questions: [
      {
        id: 'q6', category: 'diet',
        question: 'What best describes your food pattern?',
        type: 'pills', field: 'foodPattern',
        options: [
          { value: 'vegetarian', label: 'Vegetarian' },
          { value: 'vegan', label: 'Vegan' },
          { value: 'mixed', label: 'Mixed' },
          { value: 'pescatarian', label: 'Pescatarian' },
        ],
      },
      {
        id: 'q7', category: 'diet',
        question: 'How regular are your meals?',
        type: 'slider', field: 'mealRegularity', min: 1, max: 5,
        labels: ['Very Irregular', 'Very Regular'],
      },
      {
        id: 'q8', category: 'diet',
        question: 'How is your appetite generally?',
        type: 'slider', field: 'appetite', min: 1, max: 5,
        labels: ['Very Poor', 'Very Good'],
      },
    ],
  },
  {
    title: 'Food Frequency',
    subtitle: 'How often do you eat these foods?',
    questions: [
      {
        id: 'q9', category: 'diet',
        question: 'How often do you eat eggs?',
        type: 'pills', field: 'eggFrequency',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
          { value: 'daily', label: 'Daily' },
        ],
      },
      {
        id: 'q10', category: 'diet',
        question: 'How often do you consume dairy?',
        type: 'pills', field: 'dairyFrequency',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
          { value: 'daily', label: 'Daily' },
        ],
      },
      {
        id: 'q11', category: 'diet',
        question: 'How often do you eat leafy greens?',
        type: 'pills', field: 'leafyGreensFrequency',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
          { value: 'daily', label: 'Daily' },
        ],
      },
    ],
  },
  {
    title: 'More Foods & Activity',
    subtitle: 'Protein sources and movement',
    questions: [
      {
        id: 'q12', category: 'diet',
        question: 'How often do you eat legumes or lentils?',
        type: 'pills', field: 'legumesFrequency',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
          { value: 'daily', label: 'Daily' },
        ],
      },
      {
        id: 'q13', category: 'diet',
        question: 'How often do you eat meat or fish?',
        type: 'pills', field: 'meatFrequency',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
          { value: 'daily', label: 'Daily' },
        ],
      },
      {
        id: 'q14', category: 'exercise',
        question: 'How active are you physically?',
        type: 'slider', field: 'exerciseLevel', min: 1, max: 5,
        labels: ['Sedentary', 'Very Active'],
      },
    ],
  },
  {
    title: 'Symptoms',
    subtitle: 'Any noticeable patterns?',
    questions: [
      {
        id: 'q15', category: 'symptoms',
        question: 'Do you experience noticeable hair fall?',
        type: 'toggle', field: 'hairFall',
      },
      {
        id: 'q16', category: 'symptoms',
        question: 'Do you notice skin dullness or dryness?',
        type: 'toggle', field: 'skinDullness',
      },
      {
        id: 'q17', category: 'symptoms',
        question: 'Do you often feel weak or fatigued?',
        type: 'toggle', field: 'weakness',
      },
      {
        id: 'q18', category: 'symptoms',
        question: 'Do you have trouble concentrating?',
        type: 'toggle', field: 'concentrationIssues',
      },
    ],
  },
];

export const DEFAULT_QUESTIONNAIRE: Record<string, any> = {
  energyLevel: 3,
  sleepQuality: 3,
  dailyWaterIntake: 3,
  sunlightExposure: 3,
  foodPattern: 'mixed',
  eggFrequency: 'sometimes',
  dairyFrequency: 'sometimes',
  leafyGreensFrequency: 'sometimes',
  legumesFrequency: 'sometimes',
  meatFrequency: 'sometimes',
  mealRegularity: 3,
  exerciseLevel: 3,
  hairFall: false,
  skinDullness: false,
  weakness: false,
  concentrationIssues: false,
  appetite: 3,
  stressLevel: 3,
};
