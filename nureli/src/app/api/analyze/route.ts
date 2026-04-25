import { NextRequest, NextResponse } from 'next/server';
import { computeScores } from '@/lib/scoring-engine';
import { buildAnalysisPrompt, parseGeminiResponse } from '@/lib/gemini-prompt';
import { getGeminiModelWithFallback } from '@/lib/gemini-keys';
import { scanPayloadSchema } from '@/lib/validators';
import { logActivity, addScan } from '@/lib/server-store';
import { verifySessionToken } from '@/lib/session';

// Route segment config
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// Model fallback chain — different models have independent rate limits
// gemini-2.5-flash is primary (confirmed working), others as fallback
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();

    const parseResult = scanPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json({ error: 'Invalid request data', details: issues }, { status: 400 });
    }

    const { faceImage, eyeImage, handImage, leftHandImage, rightHandImage, questionnaire } = parseResult.data;

    const sessionCookie = req.cookies.get('norla_session')?.value;
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const token = sessionCookie || authHeader;
    const sessionPhone = token ? (await verifySessionToken(token)) || 'anonymous' : 'anonymous';
    const scanId = crypto.randomUUID();

    logActivity('scan_started', sessionPhone, { scan_id: scanId });

    let aiObservations = {};

    // Build image parts once (reused across retries)
    const imageList = [
      faceImage,
      eyeImage,
      leftHandImage || handImage,
      rightHandImage,
    ].filter(Boolean);

    const imageParts = imageList
      .map((img) => {
        const match = img!.match(/^data:(.*?);base64,(.*)$/);
        if (!match) return null;
        return { inlineData: { mimeType: match[1], data: match[2] } };
      })
      .filter(Boolean) as { inlineData: { mimeType: string; data: string } }[];

    const prompt = buildAnalysisPrompt(questionnaire);

    // ── Try Gemini: ONE attempt per model, fail fast ──
    // Strategy: Try each model ONCE. If it works, great.
    // If 429/503/timeout, immediately try next model.
    // Total budget: 120s (must finish before 150s client timeout)
    let aiSuccess = false;
    const totalBudgetMs = 120000; // 120s hard limit

    for (const modelName of MODEL_FALLBACK_CHAIN) {
      if (aiSuccess) break;
      
      // Check total time budget
      const elapsed = Date.now() - startTime;
      if (elapsed > totalBudgetMs) {
        console.log(`[Analyze] ${scanId} Total budget exceeded (${elapsed}ms) — stopping retries`);
        break;
      }

      // Calculate remaining time for this attempt
      const remainingMs = totalBudgetMs - elapsed;
      const attemptTimeout = Math.min(80000, remainingMs - 2000); // 80s max, leave 2s buffer
      if (attemptTimeout < 10000) {
        console.log(`[Analyze] ${scanId} Not enough time left (${remainingMs}ms) — stopping`);
        break;
      }

      let currentGemini: Awaited<ReturnType<typeof getGeminiModelWithFallback>> | null = null;

      try {
        console.log(`[Analyze] ${scanId} Trying model: ${modelName} (timeout: ${Math.round(attemptTimeout/1000)}s, elapsed: ${Math.round(elapsed/1000)}s)`);
        currentGemini = await withTimeout(getGeminiModelWithFallback(modelName), 5000, 'Gemini init');

        console.log(`[Analyze] ${scanId} Sending ${imageParts.length} images via key "${currentGemini.keyName}" model "${modelName}"`);

        const result = await withTimeout(
          currentGemini.model.generateContent([prompt, ...imageParts]),
          attemptTimeout,
          'Gemini generation'
        );

        // SUCCESS
        currentGemini.onSuccess();
        const responseText = result.response.text();
        console.log(`[Analyze] ${scanId} Gemini OK in ${Date.now() - startTime}ms (${responseText.length} chars) via "${currentGemini.keyName}" model "${modelName}"`);

        const parsed = parseGeminiResponse(responseText);
        if (parsed) {
          aiObservations = parsed;
          aiSuccess = true;
        } else {
          console.warn(`[Analyze] ${scanId} Gemini returned unparseable response`);
        }

      } catch (aiError: unknown) {
        const errMsg = aiError instanceof Error ? aiError.message : 'Unknown';
        console.error(`[Analyze] ${scanId} ${modelName} failed (${Math.round((Date.now()-startTime)/1000)}s): ${errMsg.slice(0, 200)}`);

        if (currentGemini) {
          currentGemini.onError(errMsg.slice(0, 200));
        }

        logActivity('scan_ai_error', sessionPhone, {
          scan_id: scanId,
          error: errMsg.slice(0, 200),
          model: modelName,
        }).catch(() => {});

        // Move to next model immediately (no delay for 503/timeout)
        const is429 = errMsg.includes('429') || errMsg.includes('quota');
        if (is429) {
          await delay(500); // Brief pause only for rate limits
        }
        continue;
      }
    }

    if (!aiSuccess) {
      console.log(`[Analyze] ${scanId} All Gemini keys failed — using questionnaire-only scoring`);
    }

    // Compute scores (90% AI / 10% questionnaire when AI available)
    const scanResult = computeScores(questionnaire, aiObservations);

    addScan({
      id: scanId,
      userId: `phone-${sessionPhone}`,
      userPhone: sessionPhone,
      status: 'completed',
      overallBalanceScore: scanResult.overallBalanceScore,
      nutrientScores: scanResult.nutrientScores as Record<string, unknown> | undefined,
      focusAreas: scanResult.focusAreas as unknown[] | undefined,
      recommendations: scanResult.recommendations as unknown[] | undefined,
      confidenceNote: scanResult.confidenceNote,
      createdAt: new Date().toISOString(),
    }).catch((err) => {
      console.error(`[Analyze] ${scanId} Failed to persist scan:`, err);
    });

    logActivity('scan_completed', sessionPhone, {
      scan_id: scanId,
      score: String(scanResult.overallBalanceScore),
      ai_used: aiSuccess ? 'yes' : 'no',
      total_ms: String(Date.now() - startTime),
    }).catch(() => {});

    console.log(`[Analyze] ${scanId} Done in ${Date.now() - startTime}ms, score: ${scanResult.overallBalanceScore}, AI: ${aiSuccess}`);

    return NextResponse.json({
      scanId,
      ...scanResult,
      aiUsed: aiSuccess,
      processingTime: Date.now() - startTime,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown';
    console.error(`[Analyze] Route error after ${Date.now() - startTime}ms:`, errMsg);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
