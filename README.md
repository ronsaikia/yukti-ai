# Yukti AI

Yukti AI is a speech equity audit tool focused on linguistic fairness.

The app records or uploads audio, analyzes accent and code-switching behavior, estimates bias risk, and generates a structured fairness report. It is designed around the idea that regional pronunciation and multilingual speech should not be penalized by automated systems.

## DEMO

....

## What this project does

- Captures voice input from microphone or file upload.
- Runs speech analysis using Google services (Chirp + Gemini flow).
- Produces a fairness-oriented audit payload:
	- transcript
	- per-word risk estimates
	- accent and phonetic feature analysis
	- scorecard metrics
	- explainable equity summary
- Offers a contextual repair endpoint for normalized, meaning-preserving output.
- Exposes health diagnostics for latency and service availability.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Google Generative AI SDK
- Google Cloud Speech SDK

## Project structure

```text
src/
	app/
		api/
			audit/route.ts    # streamed NDJSON audit pipeline
			repair/route.ts   # contextual transcript repair
			health/route.ts   # API liveness and latency
		components/
			AccentOriginMap.tsx
		globals.css
		layout.tsx
		page.tsx
	hooks/
		useAudioRecorder.ts # mic capture + pipeline orchestration
	components/
		PipelineVisualizer.tsx
```

## Prerequisites

- Node.js 20+
- npm 10+
- A valid Gemini API key
- Optional but recommended: Google Cloud credentials for Speech-to-Text

## Environment variables

Create a `.env.local` file in the project root with:

```bash
GEMINI_API_KEY=your_gemini_api_key

# Optional: enables Speech-to-Text stage before Gemini fallback
# Must be a JSON string (single line) containing service account credentials
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

Notes:
- If `GEMINI_API_KEY` is missing, API routes return configuration errors.
- If `GOOGLE_APPLICATION_CREDENTIALS_JSON` is missing or invalid, the app falls back to Gemini-only transcription mode.

## Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Available scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint checks
```

## API routes

### `POST /api/audit`

Runs the main fairness audit pipeline and streams results as NDJSON.

Request:
- Content-Type: `multipart/form-data`
- Field: `audio` (Blob/File)

Stream event types:
- `stage`: progress updates through the pipeline
- `retry`: retry metadata for transient provider failures
- `result`: final audit payload
- `error`: terminal error message

Response headers include in-memory processing and privacy indicators.

### `POST /api/repair`

Generates a contextual repair from transcript and audit context.

Request body:

```json
{
	"transcript": "...",
	"word_risks": [{ "word": "...", "risk": 0.3 }],
	"audit": {
		"accent_identified": "...",
		"features": "..."
	}
}
```

Response body:

```json
{
	"original": "...",
	"repaired": "...",
	"explanation": "..."
}
```

### `GET /api/health`

Performs a lightweight provider ping and returns:
- status
- model
- provider
- latencyMs
- timestamp

## Privacy behavior

The server processes uploaded audio in memory for request-time inference.
No database persistence is implemented in this codebase.

That said, external provider behavior depends on your cloud account settings and policies. Review your Google Cloud and Gemini data handling settings before production use.

## Troubleshooting

### App starts but audit fails immediately
- Confirm `GEMINI_API_KEY` is set in `.env.local`.
- Restart the dev server after changing env variables.

### Stage 1 falls back frequently
- Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` format.
- Ensure the service account has Speech permissions.

### Mic recording does not start
- Browser microphone permission is required.
- Test in a secure context (`localhost` is fine).

### Slow responses
- Check `GET /api/health` latency.
- Provider-side load spikes can trigger retries.

## Current status

This repository is actively focused on product behavior and fairness UX.
If you are onboarding, start from `src/app/page.tsx` and `src/hooks/useAudioRecorder.ts`, then review the API routes in `src/app/api`.
