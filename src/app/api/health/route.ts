import { NextResponse } from 'next/server';
import { callGeminiWithMultiKeyFallback } from '@/lib/gemini';

export async function GET() {
  const startTime = Date.now();

  try {
    // Send minimal test prompt to measure actual latency
    const text = await callGeminiWithMultiKeyFallback({
      contents: [{
        role: 'user',
        parts: [{ text: 'ping' }]
      }],
      generationConfig: {
        maxOutputTokens: 10,
      }
    });

    const latencyMs = Date.now() - startTime;

    // Check if we got a reasonable response (pong or similar)
    const isHealthy = text.toLowerCase().trim().includes('pong') || text.length > 0;

    return NextResponse.json({
      status: isHealthy ? 'ok' : 'degraded',
      model: 'gemini-2.5-flash',
      latencyMs,
      provider: 'vertex-ai',
      timestamp: new Date().toISOString(),
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'error',
      model: 'gemini-2.5-flash',
      latencyMs,
      provider: 'vertex-ai',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
