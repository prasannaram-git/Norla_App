import { NextRequest, NextResponse } from 'next/server';
import { computeScores } from '@/lib/scoring-engine';
import { buildAnalysisPrompt, parseGeminiResponse } from '@/lib/gemini-prompt';
import { getGeminiModelWithFallback } from '@/lib/gemini-keys';
import { scanPayloadSchema } from '@/lib/validators';
import { logActivity } from '@/lib/server-store';

export async function POST(req: NextRequest) {
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

    // Log scan start
    logActivity('scan_started', sessionPhone, { scan_id: scanId });

    let aiObservations = {};

    // Gemini AI analysis with key fallback
    try {
      const gemini = await getGeminiModelWithFallback();
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

      const result = await gemini.model.generateContent([
        prompt,
        ...imageParts as { inlineData: { mimeType: string; data: string } }[],
      ]);

      // Record successful usage
      await gemini.onSuccess();

      const responseText = result.response.text();
      const parsed = parseGeminiResponse(responseText);
      if (parsed) {
        aiObservations = parsed;
      }
    } catch (aiError: unknown) {
      console.error('[Analyze] Gemini failed:', aiError);
      logActivity('scan_ai_error', sessionPhone, {
        scan_id: scanId,
        error: aiError instanceof Error ? aiError.message : 'Unknown',
      });
    }

    // Compute scores (90% AI / 10% questionnaire when AI available)
    const scanResult = computeScores(questionnaire, aiObservations);

    // Log completion
    logActivity('scan_completed', sessionPhone, {
      scan_id: scanId,
      score: String(scanResult.overallBalanceScore),
    });

    return NextResponse.json({
      scanId,
      ...scanResult,
    });
  } catch (error: unknown) {
    console.error('[Analyze] Route error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
