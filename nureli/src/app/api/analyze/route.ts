import { NextRequest, NextResponse } from 'next/server';
import { computeScores } from '@/lib/scoring-engine';
import { buildAnalysisPrompt, parseGeminiResponse } from '@/lib/gemini-prompt';
import { callOpenRouter, MODEL_FALLBACK_CHAIN } from '@/lib/openrouter';
import { getNextAIKey } from '@/lib/ai-keys';
import { scanPayloadSchema } from '@/lib/validators';
import { logActivity, addScan } from '@/lib/server-store';
import { verifySessionToken } from '@/lib/session';

// Route segment config
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();

    const parseResult = scanPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json({ error: 'Invalid request data', details: issues }, { status: 400 });
    }

    const { faceImage, eyeImage, handImage, leftHandImage, rightHandImage, questionnaire, userAge, userSex } = parseResult.data;

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
        return { mimeType: match[1], data: match[2] };
      })
      .filter(Boolean) as { mimeType: string; data: string }[];

    const prompt = buildAnalysisPrompt(questionnaire, userAge, userSex);

    // ── Try OpenRouter: ONE attempt per model, fail fast ──
    let aiSuccess = false;
    const totalBudgetMs = 115000; // 115s hard limit (leave buffer for response)

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
      const attemptTimeout = Math.min(100000, remainingMs - 2000); // 100s max, leave 2s buffer
      if (attemptTimeout < 10000) {
        console.log(`[Analyze] ${scanId} Not enough time left (${remainingMs}ms) — stopping`);
        break;
      }

      let currentKey: Awaited<ReturnType<typeof getNextAIKey>> | null = null;

      try {
        // Get next API key from round-robin pool
        currentKey = await getNextAIKey();

        console.log(`[Analyze] ${scanId} Trying model: ${modelName} via key "${currentKey.keyName}" (timeout: ${Math.round(attemptTimeout/1000)}s, elapsed: ${Math.round(elapsed/1000)}s)`);

        // Call OpenRouter
        const responseText = await callOpenRouter(
          currentKey.apiKey,
          modelName,
          prompt,
          imageParts,
          attemptTimeout,
        );

        // SUCCESS — parse the response
        await currentKey.onSuccess();
        console.log(`[Analyze] ${scanId} OpenRouter OK in ${Date.now() - startTime}ms (${responseText.length} chars) via "${currentKey.keyName}" model "${modelName}"`);

        const parsed = parseGeminiResponse(responseText);
        if (parsed) {
          aiObservations = parsed;
          aiSuccess = true;
        } else {
          console.warn(`[Analyze] ${scanId} OpenRouter returned unparseable response`);
        }

      } catch (aiError: unknown) {
        const errMsg = aiError instanceof Error ? aiError.message : 'Unknown';
        console.error(`[Analyze] ${scanId} ${modelName} failed (${Math.round((Date.now()-startTime)/1000)}s): ${errMsg.slice(0, 200)}`);

        if (currentKey) {
          await currentKey.onError(errMsg.slice(0, 200));
        }

        logActivity('scan_ai_error', sessionPhone, {
          scan_id: scanId,
          error: errMsg.slice(0, 200),
          model: modelName,
        }).catch(() => {});

        // Brief pause for rate limits, immediate retry for other errors
        const is429 = errMsg.includes('429') || errMsg.includes('Rate limited');
        if (is429) {
          await new Promise(r => setTimeout(r, 500));
        }
        continue;
      }
    }

    if (!aiSuccess) {
      console.log(`[Analyze] ${scanId} All AI attempts failed — using questionnaire-only scoring`);
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
