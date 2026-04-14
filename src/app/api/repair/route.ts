import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const fetchWithRetry = async (
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  requestConfig: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0],
  retries = 3,
  delay = 1000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(requestConfig);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 503 && i < retries - 1) {
        console.warn(`503 Error. Retrying in ${delay}ms... (Attempt ${i + 1} of ${retries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

export async function POST(request: Request) {
  try {
    const { transcript, word_risks, audit } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Missing transcript' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    const repairPrompt = `You are a linguistic justice expert. Your task is to generate a contextual repair that neutralizes accent-based bias in speech recognition systems.

Given this original transcript and audit data:
- Transcript: "${transcript}"
- Identified Accent: ${audit?.accent_identified || 'Unknown'}
- Phonetic Features: ${audit?.features || 'Not analyzed'}
- High-Risk Words: ${word_risks?.map((w: { word: string; risk: number }) => `${w.word} (risk: ${(w.risk * 100).toFixed(0)}%)`).join(', ') || 'None identified'}

Generate a repaired version that:
1. Preserves the original meaning and intent.
2. CRITICAL: If the input contains Hindi, Assamese, or Code-Mixed dialects (e.g., Hinglish/Benglish), the repaired version MUST act as a Standard English translation. Example: 'Hello, mera naam Chiranjeevi hai' should become 'Hello, my name is Chiranjeevi'. Do NOT simply alter the spelling of non-English words.
3. For primarily English inputs, use phonetically similar but more universally recognized standard English patterns.
4. Maintains natural pacing, conversational tone, and addresses the specific phonetic challenges.

Return ONLY a valid JSON object with exactly these keys:
- "original": the original transcript as a string
- "repaired": the contextual repair (phonetically adjusted but meaning-preserving)
- "explanation": a 1-2 sentence explanation of what was changed and why it helps reduce AI bias

Return nothing else. No markdown, no explanation.`;

    const requestConfig = {
      contents: [{
        role: 'user',
        parts: [{ text: repairPrompt }],
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const fetchResult = await fetchWithRetry(model, requestConfig);
    const responseText = await fetchResult.response;
    const text = responseText.text();

    let jsonResult: { original: string; repaired: string; explanation: string };
    try {
      jsonResult = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', text, parseError);
      return NextResponse.json(
        {
          original: transcript,
          repaired: transcript,
          explanation: 'Unable to generate repair at this time.'
        }
      );
    }

    return NextResponse.json(jsonResult);
  } catch (error) {
    console.error('Repair API Error:', error);
    return NextResponse.json(
      { error: 'Repair generation failed' },
      { status: 500 }
    );
  }
}
