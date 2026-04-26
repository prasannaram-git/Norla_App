/**
 * OpenRouter API Client for Norla
 * 
 * Replaces the Google Gemini SDK with OpenRouter's universal REST API.
 * OpenRouter provides access to 200+ models through a single endpoint,
 * including free-tier models with zero cost.
 * 
 * API: https://openrouter.ai/api/v1/chat/completions (OpenAI-compatible)
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Model fallback chain — ordered by preference:
 * 1. Free models first (zero cost)
 * 2. Paid models as fallback (very cheap)
 */
export const MODEL_FALLBACK_CHAIN = [
  'google/gemini-2.5-flash',           // Primary — excellent vision, very cheap
  'google/gemini-2.0-flash-exp:free',   // Free fallback — good vision, zero cost
  'google/gemini-2.5-flash-lite',       // Lite fallback — faster, cheaper
];

export interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API with vision support (base64 images).
 * Uses AbortSignal.timeout for clean timeout handling.
 * 
 * @param apiKey - OpenRouter API key
 * @param model - Model identifier (e.g., 'google/gemini-2.5-flash')
 * @param prompt - Text prompt
 * @param base64Images - Array of { mimeType, data } for vision
 * @param timeoutMs - Request timeout in milliseconds
 * @returns Raw text response from the model
 */
export async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  base64Images: { mimeType: string; data: string }[],
  timeoutMs: number = 90000,
): Promise<string> {
  // Build multimodal content array (text + images)
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: prompt },
  ];

  // Add base64 images as image_url entries
  for (const img of base64Images) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mimeType};base64,${img.data}`,
      },
    });
  }

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
    max_tokens: 4096,
    temperature: 0.3, // Low temperature for consistent medical analysis
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://norla-server.onrender.com',
        'X-OpenRouter-Title': 'Norla Nutrition Analysis',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const status = response.status;

      // Classify error for retry logic
      if (status === 429) {
        throw new Error(`Rate limited (429): ${errorBody.slice(0, 200)}`);
      }
      if (status === 402) {
        throw new Error(`Insufficient credits (402): ${errorBody.slice(0, 200)}`);
      }
      if (status >= 500) {
        throw new Error(`Server error (${status}): ${errorBody.slice(0, 200)}`);
      }
      throw new Error(`OpenRouter ${status}: ${errorBody.slice(0, 300)}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter returned empty response (no choices)');
    }

    const text = data.choices[0].message?.content;
    if (!text) {
      throw new Error('OpenRouter returned empty message content');
    }

    return text;
  } catch (err: unknown) {
    clearTimeout(timer);

    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
