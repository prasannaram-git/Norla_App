import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { getNextAIKey } from '@/lib/ai-keys';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

function buildPlanPrompt(nutrientScores: Record<string, number>, userAge?: number, userSex?: string): string {
  const ageStr = userAge ? `${userAge} years old` : 'adult';
  const sexStr = userSex || 'unknown sex';

  const deficient = Object.entries(nutrientScores)
    .filter(([, score]) => score < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `${name}: ${score}/100`);

  const adequate = Object.entries(nutrientScores)
    .filter(([, score]) => score >= 75)
    .map(([name]) => name);

  return `You are Norla AI, a senior clinical nutritionist. Create a CLEAN, CONCISE daily meal plan.

PATIENT: ${ageStr}, ${sexStr}
DEFICIENCIES: ${deficient.length > 0 ? deficient.join(', ') : 'None'}
ADEQUATE: ${adequate.length > 0 ? adequate.join(', ') : 'N/A'}

Return ONLY this JSON (no markdown, no extra text):
{
  "planDate": "${new Date().toISOString().slice(0, 10)}",
  "summary": "<ONE short sentence about what this plan focuses on>",
  "dailyCalories": <number>,
  "focusNutrients": ["<Human readable name like Omega-3, Vitamin D, Iron, Protein>"],
  "meals": {
    "breakfast": {
      "time": "7:00 - 8:30 AM",
      "calories": <number>,
      "items": [
        { "food": "<food name>", "qty": "<e.g. 200g, 2 pieces, 1 cup>" }
      ]
    },
    "midMorning": {
      "time": "10:30 - 11:00 AM",
      "calories": <number>,
      "items": [
        { "food": "<name>", "qty": "<amount>" }
      ]
    },
    "lunch": {
      "time": "12:30 - 1:30 PM",
      "calories": <number>,
      "items": [
        { "food": "<name>", "qty": "<amount>" }
      ]
    },
    "evening": {
      "time": "4:00 - 5:00 PM",
      "calories": <number>,
      "items": [
        { "food": "<name>", "qty": "<amount>" }
      ]
    },
    "dinner": {
      "time": "7:30 - 8:30 PM",
      "calories": <number>,
      "items": [
        { "food": "<name>", "qty": "<amount>" }
      ]
    }
  },
  "hydration": "<short: e.g. 3.5 litres of water daily>",
  "tips": ["<short 1-line tip>", "<short 1-line tip>", "<short 1-line tip>"]
}

RULES:
- Each meal: exactly 3-4 items
- Use common Indian foods, specific quantities
- focusNutrients must be HUMAN READABLE (e.g. "Omega-3", "Iron", "Protein", "Vitamin D", "Hydration")
- Do NOT use camelCase or technical names
- summary: MAX 15 words
- hydration: MAX 10 words
- tips: MAX 15 words each, exactly 3 tips
- Return ONLY valid JSON`;
}

function extractJSON(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('No JSON found');
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
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

    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const sessionCookie = req.cookies.get('norla_session')?.value;
    const token = sessionCookie || authHeader;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const flatScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(nutrientScores)) {
      if (typeof val === 'number') flatScores[key] = val;
      else if (typeof val === 'object' && val !== null && 'score' in (val as Record<string, unknown>)) {
        flatScores[key] = (val as { score: number }).score;
      }
    }

    const prompt = buildPlanPrompt(flatScores, userAge, userSex);
    const modelsToTry = ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-exp:free', 'google/gemini-2.5-flash-lite'];
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      const model = modelsToTry[attempt % modelsToTry.length];
      try {
        const currentKey = await getNextAIKey();
        console.log(`[NutritionPlan] Attempt ${attempt + 1} model=${model}`);
        const responseText = await callOpenRouter(currentKey.apiKey, model, prompt, [], 80000);
        await currentKey.onSuccess();
        const plan = extractJSON(responseText);
        console.log(`[NutritionPlan] Success in ${Date.now() - startTime}ms`);
        return NextResponse.json({ success: true, plan, generatedAt: new Date().toISOString(), processingTime: Date.now() - startTime });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Unknown';
        console.error(`[NutritionPlan] Attempt ${attempt + 1} failed: ${lastError}`);
      }
    }

    return NextResponse.json({ error: `Failed after 3 attempts: ${lastError}` }, { status: 500 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown';
    console.error(`[NutritionPlan] Error: ${errMsg}`);
    return NextResponse.json({ error: 'Failed to generate nutrition plan.' }, { status: 500 });
  }
}
