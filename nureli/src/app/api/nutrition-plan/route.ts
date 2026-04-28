import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { getNextAIKey } from '@/lib/ai-keys';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const CURRENCY_MAP: Record<string, { symbol: string; code: string; name: string }> = {
  '+91': { symbol: '₹', code: 'INR', name: 'Indian Rupees' },
  '+1': { symbol: '$', code: 'USD', name: 'US Dollars' },
  '+44': { symbol: '£', code: 'GBP', name: 'British Pounds' },
  '+61': { symbol: 'A$', code: 'AUD', name: 'Australian Dollars' },
  '+65': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollars' },
  '+971': { symbol: 'AED', code: 'AED', name: 'UAE Dirhams' },
  '+966': { symbol: 'SAR', code: 'SAR', name: 'Saudi Riyals' },
  '+49': { symbol: '€', code: 'EUR', name: 'Euros' },
  '+33': { symbol: '€', code: 'EUR', name: 'Euros' },
  '+34': { symbol: '€', code: 'EUR', name: 'Euros' },
  '+39': { symbol: '€', code: 'EUR', name: 'Euros' },
  '+31': { symbol: '€', code: 'EUR', name: 'Euros' },
  '+81': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  '+86': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  '+82': { symbol: '₩', code: 'KRW', name: 'Korean Won' },
  '+55': { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  '+7': { symbol: '₽', code: 'RUB', name: 'Russian Rubles' },
  '+92': { symbol: 'Rs', code: 'PKR', name: 'Pakistani Rupees' },
  '+880': { symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka' },
  '+977': { symbol: 'Rs', code: 'NPR', name: 'Nepalese Rupees' },
  '+94': { symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupees' },
  '+60': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
  '+63': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
  '+62': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
  '+66': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
  '+234': { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  '+27': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  '+254': { symbol: 'KSh', code: 'KES', name: 'Kenyan Shillings' },
};

function getCurrency(phone?: string): { symbol: string; code: string; name: string } {
  if (!phone) return CURRENCY_MAP['+91'];
  // Try longest dial code first (e.g., +971 before +97)
  const digits = phone.replace(/[^+\d]/g, '');
  for (const len of [4, 3, 2]) {
    const prefix = digits.substring(0, len + 1); // includes +
    if (CURRENCY_MAP[prefix]) return CURRENCY_MAP[prefix];
  }
  return CURRENCY_MAP['+91']; // default INR
}

function buildPrompt(
  nutrientScores: Record<string, number>,
  userAge?: number,
  userSex?: string,
  currency?: { symbol: string; code: string; name: string }
): string {
  const ageStr = userAge ? `${userAge} years old` : 'adult';
  const sexStr = userSex || 'unknown sex';
  const cur = currency || CURRENCY_MAP['+91'];

  const deficient = Object.entries(nutrientScores)
    .filter(([, score]) => score < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => `${name}: ${score}/100`);

  return `You are Norla AI, a clinical nutritionist. Create a daily meal plan.

PATIENT: ${ageStr}, ${sexStr}
DEFICIENCIES: ${deficient.length > 0 ? deficient.join(', ') : 'None identified'}
CURRENCY: ${cur.symbol} (${cur.name})

Return ONLY valid JSON (no markdown, no explanations):
{
  "planDate": "${new Date().toISOString().slice(0, 10)}",
  "currency": "${cur.symbol}",
  "meals": {
    "breakfast": {
      "time": "7:00 - 8:30 AM",
      "items": [
        { "food": "Oats Porridge", "kcal": 280, "price": 25 },
        { "food": "Banana", "kcal": 105, "price": 10 },
        { "food": "Boiled Eggs (2)", "kcal": 155, "price": 20 }
      ]
    },
    "midMorning": {
      "time": "10:30 - 11:00 AM",
      "items": [
        { "food": "Apple", "kcal": 95, "price": 30 },
        { "food": "Almonds (10 pcs)", "kcal": 70, "price": 25 }
      ]
    },
    "lunch": {
      "time": "12:30 - 1:30 PM",
      "items": [
        { "food": "Brown Rice (1 cup)", "kcal": 215, "price": 15 },
        { "food": "Dal Tadka (1 bowl)", "kcal": 180, "price": 20 },
        { "food": "Mixed Sabzi", "kcal": 120, "price": 25 }
      ]
    },
    "evening": {
      "time": "4:00 - 5:00 PM",
      "items": [
        { "food": "Sprouts Chaat", "kcal": 150, "price": 20 },
        { "food": "Green Tea", "kcal": 5, "price": 10 }
      ]
    },
    "dinner": {
      "time": "7:30 - 8:30 PM",
      "items": [
        { "food": "Chapati (2)", "kcal": 240, "price": 10 },
        { "food": "Paneer Curry", "kcal": 260, "price": 40 },
        { "food": "Salad", "kcal": 45, "price": 15 }
      ]
    }
  }
}

The above is ONLY AN EXAMPLE. You MUST create a DIFFERENT plan customized for this patient's deficiencies.

CRITICAL RULES:
- Replace ALL example foods with foods that address the patient's deficiencies
- Every "kcal" MUST be the real calorie count (NEVER 0, minimum 5)
- Every "price" MUST be realistic local grocery price in ${cur.code} (NEVER 0, minimum 5)
- Each meal: 2-4 items
- Use locally available foods appropriate for the patient's region
- Food names should be short (max 4 words), put quantity in parentheses
- Return ONLY the JSON object, nothing else`;
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
    const { nutrientScores, userAge, userSex, userPhone } = body;

    if (!nutrientScores || typeof nutrientScores !== 'object') {
      return NextResponse.json({ error: 'nutrientScores required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const sessionCookie = req.cookies.get('norla_session')?.value;
    const token = sessionCookie || authHeader;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currency = getCurrency(userPhone);

    const flatScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(nutrientScores)) {
      if (typeof val === 'number') flatScores[key] = val;
      else if (typeof val === 'object' && val !== null && 'score' in (val as Record<string, unknown>)) {
        flatScores[key] = (val as { score: number }).score;
      }
    }

    const prompt = buildPrompt(flatScores, userAge, userSex, currency);
    const modelsToTry = ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-exp:free', 'google/gemini-2.5-flash-lite'];
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      const model = modelsToTry[attempt % modelsToTry.length];
      try {
        const currentKey = await getNextAIKey();
        console.log(`[NutritionPlan] Attempt ${attempt + 1} model=${model} currency=${currency.symbol}`);
        const responseText = await callOpenRouter(currentKey.apiKey, model, prompt, [], 80000);
        await currentKey.onSuccess();
        const plan = extractJSON(responseText);
        // Ensure currency symbol is included
        if (!plan.currency) plan.currency = currency.symbol;
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
