import { z } from 'zod';

const frequencySchema = z.enum(['never', 'rarely', 'sometimes', 'often', 'daily']);
const ratingSchema = z.number().min(1).max(5);

export const questionnaireSchema = z.object({
  energyLevel: ratingSchema,
  sleepQuality: ratingSchema,
  dailyWaterIntake: ratingSchema,
  sunlightExposure: ratingSchema,
  foodPattern: z.enum(['vegetarian', 'vegan', 'mixed', 'pescatarian']),
  eggFrequency: frequencySchema,
  dairyFrequency: frequencySchema,
  leafyGreensFrequency: frequencySchema,
  legumesFrequency: frequencySchema,
  meatFrequency: frequencySchema,
  mealRegularity: ratingSchema,
  exerciseLevel: ratingSchema,
  hairFall: z.boolean(),
  skinDullness: z.boolean(),
  weakness: z.boolean(),
  concentrationIssues: z.boolean(),
  appetite: ratingSchema,
  stressLevel: ratingSchema,
});

export const scanPayloadSchema = z.object({
  faceImage: z.string().min(1, 'Face image is required'),
  eyeImage: z.string().min(1, 'Eye image is required'),
  handImage: z.string().min(1, 'Hand image is required'),
  questionnaire: questionnaireSchema,
});

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
export type ScanPayloadData = z.infer<typeof scanPayloadSchema>;
