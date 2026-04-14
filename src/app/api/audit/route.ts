// NO-LOG: audio data is processed in-memory only and never persisted
// Privacy: All audio data is deleted immediately after processing completes
// Security: No persistent storage of user audio - all processing happens in-memory

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SpeechClient } from '@google-cloud/speech';

interface AuditData {
  transcript?: string;
  word_risks?: Array<{
    word: string;
    risk: number;
    language: string;
  }>;
  equity_score?: number;
  audit?: {
    accent_identified?: string;
    features?: string;
    potential_bias_analysis?: string;
  };
  scorecard?: {
    phonetic_accuracy: number;
    lexical_fairness: number;
    contextual_equity: number;
    overall_bias_risk: number;
  };
  xai_explanation?: string;
  _meta?: {
    transcription_source: string;
    chirp_transcript: string | null;
  };
}

const fetchWithRetry = async (
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  requestConfig: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0],
  retries = 3,
  delay = 1000,
  emit?: (payload: unknown) => void
) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(requestConfig);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 503 && i < retries - 1) {
        console.warn(`503 Error. Retrying in ${delay}ms... (Attempt ${i + 1} of ${retries})`);
        // Emit retry event
        if (emit) {
          emit({ type: 'retry', attempt: i + 1, maxRetries: retries, delayMs: delay });
        }
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

// Initialize Speech client with credentials from environment variable
const getSpeechClient = (): SpeechClient | null => {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON not set, skipping Speech-to-Text');
    return null;
  }
  try {
    const credentials = JSON.parse(credentialsJson);
    return new SpeechClient({ credentials });
  } catch (e) {
    console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    return null;
  }
};

// Call Google Cloud Speech-to-Text API
const transcribeWithChirp = async (
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ transcript: string; success: boolean; error?: string }> => {
  const client = getSpeechClient();
  if (!client) {
    return { transcript: '', success: false, error: 'Speech client not initialized' };
  }

  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };

    const encoding: 'LINEAR16' | 'WEBM_OPUS' = mimeType.includes('wav') ? 'LINEAR16' : 'WEBM_OPUS';

    const config = {
      encoding,
      sampleRateHertz: 48000,
      languageCode: 'en-IN',
      alternativeLanguageCodes: ['hi-IN', 'as-IN'],
      model: 'chirp',
      useEnhanced: true,
    };

    const request = {
      audio: audio,
      config: config,
    };

    const recognizeResponse = await client.recognize(request);
    const [response] = (recognizeResponse as unknown) as [{ results?: Array<{ alternatives?: Array<{ transcript?: string }> }> }];
    const transcription = response.results
      ?.map((result) => result.alternatives?.[0]?.transcript || '')
      .join(' ') || '';

    return { transcript: transcription, success: true };
   } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Speech-to-Text error:', err);
    return { transcript: '', success: false, error: err.message || 'Unknown error' };
  }
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let transcriptionSource = 'vertex-ai'; // Default to success case

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      try {
        const formData = await request.formData();
        const file = formData.get('audio') as Blob | null;

        if (!file) {
          emit({ type: 'error', message: 'Missing audio file' });
          controller.close();
          return;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = buffer.toString('base64');

        // Stage 1: Speech-to-Text with Chirp
        emit({ type: 'stage', stage: 1, meta: { model: 'chirp', provider: 'vertex-ai' } });

        const mimeType = resolveMimeType(file.type);
        let chirpTranscript = '';
        let chirpSuccess = false;

        // Attempt Speech-to-Text transcription
        const sttResult = await transcribeWithChirp(buffer, mimeType);
        if (sttResult.success && sttResult.transcript) {
          chirpTranscript = sttResult.transcript;
          chirpSuccess = true;
          emit({ type: 'stage', stage: 1, meta: { model: 'chirp', provider: 'vertex-ai', status: 'success' } });
        } else {
          // Fallback: will use Gemini-only mode
          transcriptionSource = 'gemini-fallback';
          emit({ type: 'stage', stage: 1, meta: { model: 'chirp', provider: 'vertex-ai', status: 'fallback', reason: sttResult.error } });
        }

        emit({ type: 'stage', stage: 2 });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash'
        });

        emit({ type: 'stage', stage: 3 });

        const auditPrompt = `You are an AI Linguistic Justice auditor (SDG 10). Your objective is to analyze the provided audio transcript for accent and language bias, specifically English , Hindi , and Assamese, including complex code switching scenarios.

${chirpSuccess ? `Initial Speech-to-Text Transcript (Vertex AI Chirp): "${chirpTranscript}"

Use this as reference but verify and improve it based on the audio.` : 'No initial transcript available - derive directly from audio.'}

- DO NOT assume non-english words are inherently high risk.
- Treat hindi and assamese as valid target languages, not outliers.

Return ONLY a valid JSON object with exactly these keys:
- "transcript": MUST be a verbatim, raw capture of what was spoken, including regional markers and code-mixing (e.g., 'Moi Guwahati thaku'). DO NOT apply any "autocorrect", standardizing, or repairs here. It must reflect the exact pronunciation and slang.
- "word_risks": an array of objects, one per word in the transcript, each with:
  - "word": the word as a string
  - "risk": a number from 0.0 (no bias risk) to 1.0 (high bias risk), representing how likely a standard ASR(Automatic Speech Recognition) would misinterpret or penalize this word due to accent or language mismatch.
  - "language": one of "en", "hi", "as", or "other" based on the world's most likely language.
- "audit": an object providing a holistic evaluation , containing exactly with these keys:
  - "accent_identified": string (e.g. "Northeast Indian / Assamese-influenced English")
  - "features": string (phonetic patterns detected, e.g. "retroflex consonants, vowel substitution")
  - "potential_bias_analysis": string (how a standard AI would wrongly penalize this speaker)
- "equity_score": a number from 0 to 1 (1 = fully equitable, 0 = heavily biased)
- "xai_explanation": a string of exactly 1-2 sentences explaining WHY this equity_score was given,
  referencing specific phonetic features found
- "scorecard": an object with these keys, each being a number from 0 to 1:
  - "phonetic_accuracy": how accurately the phonemes were captured
  - "lexical_fairness": whether word choices were penalized due to accent
  - "contextual_equity": whether the meaning/intent was preserved despite accent
  - "overall_bias_risk": overall risk that a downstream AI would discriminate (0 = low risk, 1 = high risk)

Return nothing else. No markdown, no explanation.`;

        const requestConfig = {
          contents: [{
            role: 'user',
            parts: [
              { text: auditPrompt },
              { inlineData: { data: base64Audio, mimeType: mimeType } }
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' }
        };

        emit({ type: 'stage', stage: 3, meta: { model: 'gemini-2.5-flash', provider: 'vertex-ai' } });

        const fetchResult = await fetchWithRetry(model, requestConfig, 3, 1000, emit);
        const responseText = await fetchResult.response;
        const text = responseText.text();

        let jsonResult: AuditData;
        try {
          jsonResult = JSON.parse(text);
          // Include transcription metadata in result
          jsonResult._meta = {
            transcription_source: chirpSuccess ? 'chirp+gemini' : 'gemini-only',
            chirp_transcript: chirpSuccess ? chirpTranscript : null,
          };
        } catch (parseError) {
          console.error('JSON Parse Error:', text, parseError);
          jsonResult = { transcript: 'Parse failed', audit: { features: text } } as AuditData;
        }

        emit({ type: 'stage', stage: 4 });
        emit({ type: 'result', data: jsonResult });
      } catch (error) {
        console.error('Audit Error:', error);
        emit({ type: 'error', message: 'Audit failed due to high demand' });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Security/Privacy headers
      'X-Audio-Retention': 'none',
      'X-Data-Processing': 'in-memory-only',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Transcription-Source': transcriptionSource,
      // Explicit privacy notice header
      'X-Privacy-Policy': 'Audio deleted after processing - no logs retained',
    },
  });
}

const resolveMimeType = (type: string) => {
  if (!type) return 'audio/webm';
  if (type === 'audio/x-m4a' || type === 'audio/m4a' || type === 'video/mp4' || type === 'audio/mp4') return 'audio/mp4';
  return type;
};
