import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


const fetchWithRetry = async (model: any, requestConfig: any, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(requestConfig);
    } catch (error: any) {
      if (error.status === 503 && i < retries - 1) {
        console.warn(`503 Error. Retrying in ${delay}ms... (Attempt ${i + 1} of ${retries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; 
      } else {
        throw error; 
      }
    }
  }
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();

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

        emit({ type: 'stage', stage: 1 });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash'
        });

        emit({ type: 'stage', stage: 2 });

        const auditPrompt = `You are an AI Linguistic Justice auditor (SDG 10). Analyze this audio for regional accent bias.

  Return ONLY a valid JSON object with exactly these keys:
  - "transcript": MUST be a verbatim, raw capture of what was spoken, including regional markers and code-mixing (e.g., 'Moi Guwahati thaku'). DO NOT apply any "autocorrect", standardizing, or repairs here. It must reflect the exact pronunciation and slang.
  - "word_risks": an array of objects, one per word in the transcript, each with:
    - "word": the word as a string
    - "risk": a number from 0.0 (no bias risk) to 1.0 (high bias risk), representing how likely a standard AI would misinterpret or penalize this word due to accent
  - "audit": an object with keys:
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

        const resolveMimeType = (type: string) => {
          if (!type) return 'audio/webm';
          if (type === 'audio/x-m4a' || type === 'audio/m4a' || type === 'video/mp4' || type === 'audio/mp4') return 'audio/mp4'; 
          return type;
        };

        const requestConfig = {
          contents: [{
            role: 'user',
            parts: [
              { text: auditPrompt },
              { inlineData: { data: base64Audio, mimeType: resolveMimeType(file.type) } }
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' }
        };

        emit({ type: 'stage', stage: 3 });

        const result = await fetchWithRetry(model, requestConfig);
        const response = await result.response;
        const text = response.text();

        let jsonResult: any;
        try {
          jsonResult = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON Parse Error:', text, parseError);
          jsonResult = { transcript: 'Parse failed', audit: text };
        }

        emit({ type: 'stage', stage: 4 });
        emit({ type: 'result', data: jsonResult });
      } catch (error) {
        console.error('Gemini SDK Error:', error);
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
    },
  });
}