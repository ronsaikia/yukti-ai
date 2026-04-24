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
  isVisionMode?: boolean,
  pdfBase64?: string
): Promise<string> {
  // Collect API keys from environment variables
  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ]
    .filter((key): key is string => key !== undefined && key !== '')
    .map(key => key.trim());

  // Fallback to single key if no numbered keys are set
  if (apiKeys.length === 0) {
    const singleKey = process.env.GEMINI_API_KEY;
    if (singleKey && singleKey !== '') {
      apiKeys.push(singleKey.trim());
    }
  }

  if (apiKeys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  // Rate-limit/quota error indicators
  const isRateLimitError = (error: unknown): boolean => {
    const err = error as { status?: number; message?: string };
    const message = err.message?.toLowerCase() || '';
    return (
      err.status === 429 ||
      err.status === 503 ||
      message.includes('quota') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('resource exhausted')
    );
  };

  // Try each key with retries
  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];

    // Initialize model for this key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Allow max 2 retries per key (total 3 attempts: initial + 2 retries)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(requestConfig);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim() === '') {
          throw new Error('Empty response from Gemini API');
        }

        return text;
      } catch (error: unknown) {
        // If this is not a rate-limit error, do not retry on the same key. Move to the next key.
        if (!isRateLimitError(error)) {
          console.warn(`Key ${keyIndex + 1} encountered a non-rate-limit error. Trying next key...`, error);
          break;
        }

        // If it's the last attempt for this key, break to try the next key
        if (attempt === 2) {
          console.warn(`Key ${keyIndex + 1} exhausted after 3 attempts. Trying next key...`);
          break;
        }

        // Calculate delay: 500ms for first retry, 1000ms for second retry
        const delayMs = attempt === 0 ? 500 : 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Wait 500ms before trying next key (except after the last key)
    if (keyIndex < apiKeys.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // If we get here, all keys failed due to rate limits/quotas
  throw new Error('All Gemini API keys failed due to rate limits or quotas');
}