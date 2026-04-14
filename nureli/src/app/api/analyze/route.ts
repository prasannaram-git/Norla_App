import { NextRequest, NextResponse } from 'next/server';
import { computeScores } from '@/lib/scoring-engine';
import { buildAnalysisPrompt, parseGeminiResponse } from '@/lib/gemini-prompt';
import { getGeminiModelWithFallback } from '@/lib/gemini-keys';
import { scanPayloadSchema } from '@/lib/validators';
import { logActivity } from '@/lib/server-store';

// Helper: run a promise with a timeout
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

    // Validate request payload
    const parseResult = scanPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json(
        { error: 'Invalid request data', details: issues },
        { status: 400 }
      );
    }

    const { faceImage, eyeImage, handImage, questionnaire } = parseResult.data;

    // Get user info from session cookie
    const sessionPhone = req.cookies.get('norla_session')?.value || 'anonymous';
    const scanId = crypto.randomUUID();

    // Log scan start (fire and forget)
    logActivity('scan_started', sessionPhone, { scan_id: scanId });

    let aiObservations = {};

    // Gemini AI analysis with 25-second timeout (Render free tier kills at 30s)
    try {
      console.log(`[Analyze] ${scanId} Starting Gemini AI analysis...`);
      const gemini = await withTimeout(
        getGeminiModelWithFallback(),
        5000,
        'Gemini model init'
      );
      const prompt = buildAnalysisPrompt(questionnaire);

      // Convert base64 images to parts
      const imageParts = [faceImage, eyeImage, handImage]
        .filter(Boolean)
        .map((img) => {
          const match = img.match(/^data:(.*?);base64,(.*)$/);
          if (!match) return null;
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          };
        })
        .filter(Boolean);

      console.log(`[Analyze] ${scanId} Sending ${imageParts.length} images to Gemini (payload prep: ${Date.now() - startTime}ms)`);

      const result = await withTimeout(
        gemini.model.generateContent([
          prompt,
          ...imageParts as { inlineData: { mimeType: string; data: string } }[],
        ]),
        25000,      // 25 second timeout for the AI call itself
        'Gemini AI generation'
      );

      // Record successful usage
      gemini.onSuccess().catch(() => {});

      const responseText = result.response.text();
      console.log(`[Analyze] ${scanId} Gemini responded in ${Date.now() - startTime}ms (${responseText.length} chars)`);
      
      const parsed = parseGeminiResponse(responseText);
      if (parsed) {
        aiObservations = parsed;
      }
    } catch (aiError: unknown) {
      const errMsg = aiError instanceof Error ? aiError.message : 'Unknown';
      console.error(`[Analyze] ${scanId} Gemini failed after ${Date.now() - startTime}ms:`, errMsg);
      logActivity('scan_ai_error', sessionPhone, {
        scan_id: scanId,
        error: errMsg,
      }).catch(() => {});
      // Continue — we'll still return questionnaire-based scores
    }

    // Compute scores (90% AI / 10% questionnaire when AI available, 100% questionnaire when AI fails)
    const scanResult = computeScores(questionnaire, aiObservations);

    // Log completion (fire and forget)
    logActivity('scan_completed', sessionPhone, {
      scan_id: scanId,
      score: String(scanResult.overallBalanceScore),
      ai_used: Object.keys(aiObservations).length > 0 ? 'yes' : 'no',
      total_ms: String(Date.now() - startTime),
    }).catch(() => {});

    console.log(`[Analyze] ${scanId} Complete in ${Date.now() - startTime}ms, score: ${scanResult.overallBalanceScore}`);

    return NextResponse.json({
      scanId,
      ...scanResult,
    });
  } catch (error: unknown) {
    console.error(`[Analyze] Route error after ${Date.now() - startTime}ms:`, error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
