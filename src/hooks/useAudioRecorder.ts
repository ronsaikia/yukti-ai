import { useState, useRef, useCallback } from 'react';

// ─── Mock audit data for demo/testing ────────────────────────────────────────
const DEMO_ACCENT_IDENTIFIED = 'Hindi';

const MOCK_AUDIT_DATA = {
  transcript: "I'm speaking in my regional dialect and the system should capture my authentic phonetic patterns.",
  word_risks: [
    { word: "speaking", risk: 0.15, language: "en" },
    { word: "regional", risk: 0.28, language: "en" },
    { word: "dialect", risk: 0.35, language: "en" },
    { word: "system", risk: 0.08, language: "en" },
    { word: "authentic", risk: 0.22, language: "en" },
    { word: "phonetic", risk: 0.12, language: "en" },
  ],
  audit: {
    accent_identified: DEMO_ACCENT_IDENTIFIED,
    features: "retroflex consonants, vowel substitution /ə/ → /ɪ/, non-syllabic nasals",
    potential_bias_analysis: "Standard ASR models would penalize retroflex /ḍ/ sounds and compress vowel space, leading to 40% lower confidence scores than General American English speakers.",
  },
  equity_score: 0.82,
  xai_explanation: "High phonetic accuracy preserved regional vowel patterns and retroflex consonants without normalization. Contextual meaning remained intact despite dialectal variation.",
  scorecard: {
    phonetic_accuracy: 0.85,
    lexical_fairness: 0.80,
    contextual_equity: 0.84,
    overall_bias_risk: 0.12,
  },
};

interface AuditData {
  transcript: string;
  word_risks: Array<{
    word: string;
    risk: number;
    language: string;
  }>;
  audit: {
    accent_identified: string;
    features: string;
    potential_bias_analysis: string;
  };
  equity_score: number;
  xai_explanation: string;
  scorecard: {
    phonetic_accuracy: number;
    lexical_fairness: number;
    contextual_equity: number;
    overall_bias_risk: number;
  };
}

interface RepairData {
  original: string;
  repaired: string;
  explanation: string;
}


export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [repairData, setRepairData] = useState<RepairData | null>(null);
  const [isGeneratingRepair, setIsGeneratingRepair] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; maxRetries: number } | null>(null);
  const [latencyInfo, setLatencyInfo] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const lastBlobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetAudit = useCallback(() => {
    setAuditData(null);
    setRepairData(null);
    setPipelineStage(-1);
    setApiError(null);
    setMicPermissionDenied(false);
    setIsRecording(false);
    setRetryInfo(null);
    setLatencyInfo(null);
    lastBlobRef.current = null;
    if (mediaRecorder.current && mediaRecorder.current.stream) {
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
  }, []);

  const processAudioBlob = useCallback(async (blob: Blob, processType: string = 'audio/webm') => {
    setIsProcessing(true);
    setPipelineStage(0);
    setAuditData(null);
    setRepairData(null);
    setApiError(null);
    setRetryInfo(null);

    const formData = new FormData();
    const ext = processType.includes('mp3') ? 'mp3' : processType.includes('wav') ? 'wav' : 'webm';
    formData.append('audio', blob, `audio.${ext}`);

    let finalResultData: AuditData | null = null;
    let finalError: string | null = null;
    let isApiDone = false;

    // Store reference for potential retry
    lastBlobRef.current = blob;

    // Run backend fetch independently
    (async () => {
      try {
        const response = await fetch('/api/audit', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok || !response.body) {
          const errorResult = await response.json().catch(() => ({}));
          console.error('Backend returned an error. Wait aborted:', errorResult);
          finalError = 'Failed to process audio. API quota may be exceeded.';
          isApiDone = true;
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let bufferText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          bufferText += decoder.decode(value, { stream: true });
          const lines = bufferText.split('\n');
          bufferText = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const payload = JSON.parse(line);
              if (payload.type === 'result' && payload.data) {
                finalResultData = payload.data;
              }
              if (payload.type === 'error') {
                console.error('Audit pipeline error:', payload.message);
                finalError = payload.message || 'Audit pipeline error';
              }
              if (payload.type === 'retry') {
                setRetryInfo({ attempt: payload.attempt, maxRetries: payload.maxRetries });
              }
            } catch (parseError) {
              console.warn('Skipping non-JSON pipeline line:', line, parseError);
            }
          }
        }
      } catch (error) {
        console.error("Error sending audio to audit:", error);
        finalError = 'Network error. Please try again.';
      } finally {
        isApiDone = true;
      }
    })();

    // UX Staggered Progress logic
    try {
      setPipelineStage(0); // Audio Capture
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPipelineStage(1); // Chip 3 Base
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPipelineStage(2); // Phonetic Layer
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPipelineStage(3); // Gemini API

      // Wait for actual API processing to finish if it hasn't already
      while (!isApiDone) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!finalError) {
        setPipelineStage(4); // Equity Score
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (finalError) {
        setApiError(finalError);
      } else if (finalResultData) {
        setAuditData(finalResultData);
        // Fetch health/latency after successful audit
        try {
          const healthResponse = await fetch('/api/health');
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            if (healthData.latencyMs) {
              setLatencyInfo(healthData.latencyMs.toString());
            }
          }
        } catch {
          // Silently ignore health check failures
        }
      }
    } finally {
      setIsProcessing(false);
      // Nullify blob reference after sending (privacy)
      chunks.current = [];
    }
  }, []);

  const startRecording = useCallback(async () => {
    resetAudit();

    try {
      // Explicit Hardware Checking
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'denied') {
            setMicPermissionDenied(true);
            return;
          }
          permissionStatus.onchange = () => {
             if (permissionStatus.state === 'denied') {
               setMicPermissionDenied(true);
             } else if (permissionStatus.state === 'granted') {
               setMicPermissionDenied(false);
             }
          };
        } catch {
          // Safari fallback gracefully
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermissionDenied(false);

      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        lastBlobRef.current = blob;
        await processAudioBlob(blob, 'audio/webm');
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setMicPermissionDenied(true);
      } else {
        console.error('Microphone access error:', err);
      }
    }
  }, [resetAudit, processAudioBlob]);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  }, []);

  // Demo mode to show results with mock data
  const startDemo = async () => {
    setAuditData(null);
    setRepairData(null);
    setPipelineStage(-1);
    setApiError(null);
    setIsProcessing(true);
    setRetryInfo(null);

    // Simulate real-time pipeline stages
    const stageDurations = [600, 900, 800, 1000, 700];
    for (let i = 0; i < 5; i++) {
      setPipelineStage(i);
      await new Promise(resolve => setTimeout(resolve, stageDurations[i]));
    }

    // Return mock data
    setAuditData(MOCK_AUDIT_DATA);
    setIsProcessing(false);
    setPipelineStage(-1);

    // Fetch latency for demo too
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.latencyMs) {
          setLatencyInfo(healthData.latencyMs.toString());
        }
      }
    } catch {
      // Silently ignore
    }
  };

  const generateContextualRepair = useCallback(async () => {
    if (!auditData) return;

    setIsGeneratingRepair(true);
    try {
      const response = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: auditData.transcript,
          word_risks: auditData.word_risks,
          audit: auditData.audit,
        }),
      });

      if (!response.ok) {
        console.error('Repair generation failed');
        return;
      }

      const data = await response.json();
      setRepairData(data);
    } catch (error) {
      console.error('Error generating repair:', error);
    } finally {
      setIsGeneratingRepair(false);
    }
  }, [auditData]);

  const dismissMicPopup = () => setMicPermissionDenied(false);

  return {
    isRecording,
    startRecording,
    stopRecording,
    auditData,
    isProcessing,
    pipelineStage,
    repairData,
    isGeneratingRepair,
    generateContextualRepair,
    startDemo,
    apiError,
    processAudioBlob,
    micPermissionDenied,
    dismissMicPopup,
    resetAudit,
    retryInfo,
    lastBlobRef,
    latencyInfo,
    streamRef,
  };
};
