
import { NextResponse } from 'next/server';
import { callGeminiWithMultiKeyFallback } from '@/lib/gemini';

// In-memory cache for health check
let lastHealthResult: any = null;
let lastHealthTimestamp = 0;
const HEALTH_CACHE_TTL_MS = 60 * 5000; // 1 minute

export async function GET() {
  const now = Date.now();
  if (lastHealthResult && (now - lastHealthTimestamp < HEALTH_CACHE_TTL_MS)) {
    // Serve cached result
    return NextResponse.json(lastHealthResult.body, {
      status: lastHealthResult.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  const startTime = now;
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
    const body = {
      status: isHealthy ? 'ok' : 'degraded',
      model: 'gemini-2.5-flash',
      latencyMs,
      provider: 'vertex-ai',
      timestamp: new Date().toISOString(),
    };
    const status = isHealthy ? 200 : 503;
    lastHealthResult = { body, status };
    lastHealthTimestamp = now;
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('Health check failed:', error);
    const body = {
      status: 'error',
      model: 'gemini-2.5-flash',
      latencyMs,
      provider: 'vertex-ai',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    };
    lastHealthResult = { body, status: 503 };
    lastHealthTimestamp = now;
    return NextResponse.json(body, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
