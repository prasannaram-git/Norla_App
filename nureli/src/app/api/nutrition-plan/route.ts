import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter, MODEL_FALLBACK_CHAIN } from '@/lib/openrouter';
import { getNextAIKey } from '@/lib/ai-keys';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

function buildPlanPrompt(nutrientScores: Record<string, number>, userAge?: number, userSex?: string): string {
  const ageStr = userAge ? `${userAge} years old` : 'adult';
  const sexStr = userSex || 'unknown sex';

  const deficientNutrients = Object.entries(nutrientScores)
    .filter(([, score]) => score < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `${name}: ${score}/100`);

  const strongNutrients = Object.entries(nutrientScores)
    .filter(([, score]) => score >= 75)
    .map(([name, score]) => `${name}: ${score}/100`);

  return `You are Norla AI — a certified clinical nutritionist and dietitian with 20+ years experience. Create a COMPREHENSIVE, DOCTOR-LEVEL daily nutrition plan.

PATIENT: ${ageStr}, ${sexStr}

NUTRIENT DEFICIENCIES (priority — need dietary intervention):
${deficientNutrients.length > 0 ? deficientNutrients.join('\n') : 'No significant deficiencies.'}

ADEQUATE NUTRIENTS (maintain):
${strongNutrients.length > 0 ? strongNutrients.join('\n') : 'N/A'}

CREATE a clinical-grade daily meal plan with:
1. PRIORITIZE foods addressing deficient nutrients
2. Use LOCALLY AVAILABLE, AFFORDABLE Indian foods
3. Include SPECIFIC quantities (grams, cups, pieces)
4. Each food item explains WHICH nutrient it targets
5. Include estimated CALORIES per meal
6. Include PROTEIN, CARBS, FAT grams per meal
7. 4-6 food items per meal for comprehensive coverage
8. Is REALISTIC — normal person can follow daily

Return ONLY this JSON (no markdown, no extra text):
{
  "planDate": "${new Date().toISOString().slice(0, 10)}",
  "summary": "<2-3 sentence clinical summary of what this plan focuses on and why>",
  "dailyCalories": <estimated total daily calories as number>,
  "targetNutrients": ["<nutrient1>", "<nutrient2>", "<nutrient3>"],
  "deficiencies": [
    { "nutrient": "<name>", "score": <number>, "priority": "high|medium|low", "action": "<brief dietary action>" }
  ],
  "meals": {
    "breakfast": {
      "time": "7:00 - 8:30 AM",
      "calories": <number>,
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>,
      "items": [
        { "food": "<food name>", "quantity": "<e.g., 200g, 2 pieces>", "nutrient": "<target nutrient>", "benefit": "<1 sentence why>" }
      ]
    },
    "midMorning": {
      "time": "10:30 - 11:00 AM",
      "calories": <number>,
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>,
      "items": [
        { "food": "<name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "lunch": {
      "time": "12:30 - 1:30 PM",
      "calories": <number>,
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>,
      "items": [
        { "food": "<name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "evening": {
      "time": "4:00 - 5:00 PM",
      "calories": <number>,
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>,
      "items": [
        { "food": "<name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "dinner": {
      "time": "7:30 - 8:30 PM",
      "calories": <number>,
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>,
      "items": [
        { "food": "<name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    }
  },
  "hydration": "<detailed daily water recommendation with reasoning>",
  "tips": ["<clinical tip 1>", "<clinical tip 2>", "<clinical tip 3>", "<clinical tip 4>"]
}

RULES:
- Each meal MUST have 4-6 items
- Use common Indian foods
- Be SPECIFIC with quantities
- Include variety — don't repeat foods across meals
- Return ONLY valid JSON, no markdown fences, no extra text`;
}

function extractJSON(text: string): any {
  let cleaned = text.trim();
  // Strip markdown fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  // Strip any leading/trailing non-JSON text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No JSON object found in AI response');
  }
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  // Fix common JSON issues
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { nutrientScores, userAge, userSex } = body;

    if (!nutrientScores || typeof nutrientScores !== 'object') {
      return NextResponse.json({ error: 'nutrientScores required' }, { status: 400 });
    }

    // Verify auth
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const sessionCookie = req.cookies.get('norla_session')?.value;
    const token = sessionCookie || authHeader;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Flatten scores
    const flatScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(nutrientScores)) {
      if (typeof val === 'number') flatScores[key] = val;
      else if (typeof val === 'object' && val !== null && 'score' in (val as Record<string, unknown>)) {
        flatScores[key] = (val as { score: number }).score;
      }
    }

    const prompt = buildPlanPrompt(flatScores, userAge, userSex);

    // Models to try — fallback chain
    const modelsToTry = ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-exp:free', 'google/gemini-2.5-flash-lite'];
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      const model = modelsToTry[attempt % modelsToTry.length];
      try {
        const currentKey = await getNextAIKey();
        console.log(`[NutritionPlan] Attempt ${attempt + 1} with model=${model}, key=${currentKey.provider}`);

        const responseText = await callOpenRouter(
          currentKey.apiKey,
          model,
          prompt,
          [],
          80000,
        );

        await currentKey.onSuccess();

        const plan = extractJSON(responseText);

        console.log(`[NutritionPlan] Success in ${Date.now() - startTime}ms (model=${model}, attempt=${attempt + 1})`);

        return NextResponse.json({
          success: true,
          plan,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          model,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        lastError = msg;
        console.error(`[NutritionPlan] Attempt ${attempt + 1} failed (model=${model}): ${msg}`);
        // Continue to next attempt
      }
    }

    // All attempts failed
    console.error(`[NutritionPlan] All 3 attempts failed after ${Date.now() - startTime}ms. Last error: ${lastError}`);
    return NextResponse.json({ error: `Failed after 3 attempts: ${lastError}` }, { status: 500 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown';
    console.error(`[NutritionPlan] Error after ${Date.now() - startTime}ms:`, errMsg);
    return NextResponse.json({ error: 'Failed to generate nutrition plan. Please try again.' }, { status: 500 });
  }
}
