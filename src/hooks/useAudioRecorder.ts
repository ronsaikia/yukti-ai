import { useState, useRef } from 'react';

// ─── Mock audit data for demo/testing ────────────────────────────────────────
const MOCK_AUDIT_DATA = {
  transcript: "I'm speaking in my regional dialect and the system should capture my authentic phonetic patterns.",
  word_risks: [
    { word: "speaking", risk: 0.15 },
    { word: "regional", risk: 0.28 },
    { word: "dialect", risk: 0.35 },
    { word: "system", risk: 0.08 },
    { word: "authentic", risk: 0.22 },
    { word: "phonetic", risk: 0.12 },
  ],
  audit: {
    accent_identified: "Northeast Indian / Assamese-influenced English",
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

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [repairData, setRepairData] = useState<any>(null);
  const [isGeneratingRepair, setIsGeneratingRepair] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setAuditData(null);
    setRepairData(null);
    setPipelineStage(-1);
    setApiError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = async () => {
      setIsProcessing(true);
      setPipelineStage(0);
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');

      try {
        const response = await fetch('/api/audit', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok || !response.body) {
          const errorResult = await response.json().catch(() => ({}));
          console.error('Backend returned an error. Wait aborted:', errorResult);
          setApiError('Failed to process audio. API quota may be exceeded.');
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

              if (payload.type === 'stage' && typeof payload.stage === 'number') {
                setPipelineStage(payload.stage);
              }

              if (payload.type === 'result' && payload.data) {
                setAuditData(payload.data);
              }

              if (payload.type === 'error') {
                console.error('Audit pipeline error:', payload.message);
                setApiError(payload.message || 'Audit pipeline error');
              }
            } catch (parseError) {
              console.warn('Skipping non-JSON pipeline line:', line, parseError);
            }
          }
        }
      } catch (error) {
        console.error("Error sending audio to audit:", error);
        setApiError('Network error. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  // Demo mode to show results with mock data
  const startDemo = async () => {
    setAuditData(null);
    setRepairData(null);
    setPipelineStage(-1);
    setApiError(null);
    setIsProcessing(true);

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
  };

  const generateContextualRepair = async () => {
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
  };

  return { isRecording, startRecording, stopRecording, auditData, isProcessing, pipelineStage, repairData, isGeneratingRepair, generateContextualRepair, startDemo, apiError };
};