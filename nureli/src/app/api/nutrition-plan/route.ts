import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { getNextAIKey } from '@/lib/ai-keys';
import { verifySessionToken } from '@/lib/session';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

function buildPlanPrompt(nutrientScores: Record<string, number>, userAge?: number, userSex?: string, foodPattern?: string): string {
  const ageStr = userAge ? `${userAge} years old` : 'adult';
  const sexStr = userSex || 'unknown sex';
  const dietStr = foodPattern || 'mixed';

  const deficientNutrients = Object.entries(nutrientScores)
    .filter(([, score]) => score < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `${name}: ${score}/100`);

  const strongNutrients = Object.entries(nutrientScores)
    .filter(([, score]) => score >= 75)
    .map(([name, score]) => `${name}: ${score}/100`);

  return `You are Norla AI — a certified clinical nutritionist and dietitian with 20+ years of experience creating personalized meal plans. You create REALISTIC, PRACTICAL daily meal plans using commonly available foods.

PATIENT: ${ageStr}, ${sexStr}, dietary pattern: ${dietStr}

NUTRIENT DEFICIENCIES (priority — these need dietary intervention):
${deficientNutrients.length > 0 ? deficientNutrients.join('\n') : 'No significant deficiencies detected.'}

ADEQUATE NUTRIENTS (maintain current intake):
${strongNutrients.length > 0 ? strongNutrients.join('\n') : 'N/A'}

CREATE a personalized daily meal plan that:
1. PRIORITIZES foods that address the deficient nutrients
2. Uses LOCALLY AVAILABLE, AFFORDABLE foods (Indian cuisine preferred for this patient)
3. Includes SPECIFIC quantities (grams, cups, pieces)
4. Each food item explains WHICH nutrient it targets
5. Considers the patient's dietary pattern (${dietStr})
6. Is REALISTIC — a normal person can actually follow this daily

Return ONLY this JSON:
\`\`\`json
{
  "planDate": "${new Date().toISOString().slice(0, 10)}",
  "summary": "<1-2 sentence personalized summary of what this plan focuses on>",
  "targetNutrients": ["<nutrient1>", "<nutrient2>"],
  "meals": {
    "breakfast": {
      "time": "7:00 - 8:30 AM",
      "items": [
        { "food": "<food name>", "quantity": "<e.g., 200g, 2 pieces, 1 cup>", "nutrient": "<which nutrient this targets>", "benefit": "<1 sentence why>" }
      ]
    },
    "midMorning": {
      "time": "10:30 - 11:00 AM",
      "items": [
        { "food": "<snack name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "lunch": {
      "time": "12:30 - 1:30 PM",
      "items": [
        { "food": "<food name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "evening": {
      "time": "4:00 - 5:00 PM",
      "items": [
        { "food": "<snack name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    },
    "dinner": {
      "time": "7:30 - 8:30 PM",
      "items": [
        { "food": "<food name>", "quantity": "<amount>", "nutrient": "<target>", "benefit": "<why>" }
      ]
    }
  },
  "hydration": "<daily water recommendation with reasoning>",
  "tips": ["<tip1>", "<tip2>", "<tip3>"]
}
\`\`\`

RULES:
- Each meal should have 2-4 items
- Use common, easy-to-find foods
- Be specific with quantities
- If vegetarian/vegan, respect dietary restrictions strictly
- Include variety — don't repeat the same food across meals
- Return ONLY JSON. No markdown, no extra text.`;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { nutrientScores, userAge, userSex, foodPattern } = body;

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

    // Flatten scores if nested
    const flatScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(nutrientScores)) {
      if (typeof val === 'number') flatScores[key] = val;
      else if (typeof val === 'object' && val !== null && 'score' in (val as Record<string, unknown>)) {
        flatScores[key] = (val as { score: number }).score;
      }
    }

    const prompt = buildPlanPrompt(flatScores, userAge, userSex, foodPattern);

    // Try to generate plan
    const currentKey = await getNextAIKey();

    const responseText = await callOpenRouter(
      currentKey.apiKey,
      'google/gemini-2.5-flash',
      prompt,
      [], // No images needed
      60000,
    );

    await currentKey.onSuccess();

    // Parse response
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const plan = JSON.parse(cleaned);

    console.log(`[NutritionPlan] Generated in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      plan,
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown';
    console.error(`[NutritionPlan] Error after ${Date.now() - startTime}ms:`, errMsg);
    return NextResponse.json({ error: 'Failed to generate nutrition plan. Please try again.' }, { status: 500 });
  }
}
