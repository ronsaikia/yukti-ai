import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Calls Gemini API with multi-key fallback mechanism
 * @param requestConfig - The configuration for the generateContent call
 * @param isVisionMode - Whether this is a vision request (unused but kept for signature compatibility)
 * @param pdfBase64 - Base64 encoded PDF data (unused but kept for signature compatibility)
 * @returns The generated text response
 */
export async function callGeminiWithMultiKeyFallback(
  requestConfig: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0],
  _isVisionMode?: boolean,
  _pdfBase64?: string
): Promise<string> {
  // Collect API keys from environment variables
  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ]
    .filter((key): key is string => !!key && key.trim() !== '')
    .map((key) => key.trim());

  // Fallback to single key
  if (apiKeys.length === 0) {
    const singleKey = process.env.GEMINI_API_KEY;
    if (singleKey?.trim()) apiKeys.push(singleKey.trim());
  }

  if (apiKeys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  // Rate-limit/quota error indicators
  const isRateLimitError = (error: unknown): boolean => {
    const err = error as { status?: number; message?: string };
    const message = err.message?.toLowerCase() ?? '';
    return (
      err.status === 429 ||
      err.status === 503 ||
      message.includes('quota') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('resource exhausted') ||
      message.includes('service unavailable')
    );
  };

  /**
   * Exponential backoff with jitter.
   * attempt 0 → ~5s, attempt 1 → ~10s, attempt 2 → ~20s
   * Capped at 30s. Adding ±20% jitter prevents thundering herd.
   */
  const backoffMs = (attempt: number): number => {
    const base = Math.min(5000 * Math.pow(2, attempt), 30_000);
    const jitter = base * 0.2 * (Math.random() * 2 - 1); // ±20%
    return Math.round(base + jitter);
  };

  const MAX_ATTEMPTS_PER_KEY = 3;

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const genAI = new GoogleGenerativeAI(apiKeys[keyIndex]);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_KEY; attempt++) {
      try {
        const result = await model.generateContent(requestConfig);
        const response = await result.response;
        const text = response.text();

        if (!text?.trim()) throw new Error('Empty response from Gemini API');
        return text;

      } catch (error: unknown) {
        const isQuota = isRateLimitError(error);

        if (!isQuota) {
          // Non-quota error (bad request, auth, etc.) — skip to next key immediately
          console.warn(`Key ${keyIndex + 1} non-quota error, skipping key:`, (error as Error).message);
          break;
        }

        const isLastAttempt = attempt === MAX_ATTEMPTS_PER_KEY - 1;
        const isLastKey = keyIndex === apiKeys.length - 1;

        if (isLastAttempt) {
          console.warn(`Key ${keyIndex + 1} exhausted all ${MAX_ATTEMPTS_PER_KEY} attempts.`);
          break; // Move to next key
        }

        const delay = backoffMs(attempt);
        console.warn(
          `Key ${keyIndex + 1} quota hit (attempt ${attempt + 1}/${MAX_ATTEMPTS_PER_KEY}). ` +
          `Waiting ${Math.round(delay / 1000)}s before retry...`
        );

        // Emit a retryInfo-compatible signal via a custom error property so the
        // route handler can stream it to the client (see Phase 2)
        if (!isLastKey || !isLastAttempt) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Pause between keys to avoid hammering Google from the same IP
    if (keyIndex < apiKeys.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }

  throw new Error('All Gemini API keys are rate-limited or exhausted. Please try again in a few minutes.');
}