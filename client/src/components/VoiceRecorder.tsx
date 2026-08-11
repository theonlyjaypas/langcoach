import { useState, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import type { VoiceRecorderState, TranscribeResponse } from '../types';
import './VoiceRecorder.css';

interface VoiceRecorderProps {
  onMessage: (content: string, type: 'text' | 'voice') => void;
  loading: boolean;
  onModeChange?: (mode: 'text' | 'voice') => void;
}

export default function VoiceRecorder({
  onMessage,
  loading,
  onModeChange,
}: VoiceRecorderProps) {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [textInput, setTextInput] = useState('');
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    time: 0,
    transcript: '',
    isProcessing: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { show: showToast } = useToast();

  const updateState = useCallback((updates: Partial<VoiceRecorderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      updateState({ isRecording: true, time: 0, transcript: '' });

      timerRef.current = setInterval((): void => {
        setState((prev) => {
          const newTime = prev.time + 1;
          if (newTime >= 60) {
            stopRecording();
            showToast('Recording stopped (60 second limit)', 'warning');
          }
          return { ...prev, time: newTime };
        });
      }, 1000);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Microphone access denied',
        'error'
      );
      updateState({ isRecording: false });
    }
  }, [updateState, showToast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    updateState({ isRecording: false, isProcessing: true });

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];

            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio }),
            });

            if (!response.ok) {
              throw new Error('Transcription failed');
            }

            const data: TranscribeResponse = await response.json();

            onMessage(data.text, 'voice');
            updateState({
              transcript: data.text,
              isProcessing: false,
              time: 0,
            });

            showToast('Message sent', 'success');
          } catch (err) {
            showToast(
              err instanceof Error ? err.message : 'Failed to process audio',
              'error'
            );
            updateState({ isProcessing: false });
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to process audio',
          'error'
        );
        updateState({ isProcessing: false });
      }
    };
  }, [updateState, onMessage, showToast]);

  const handleSendText = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (textInput.trim() && !loading) {
        onMessage(textInput.trim(), 'text');
        setTextInput('');
      }
    },
    [textInput, loading, onMessage]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="input-area">
      <div className="mode-selector">
        <label htmlFor="input-mode" className="mode-label">
          Input Mode:
        </label>
        <select
          id="input-mode"
          value={mode}
          onChange={(e) => {
            const newMode = e.target.value as 'text' | 'voice';
            setMode(newMode);
            onModeChange?.(newMode);
          }}
          disabled={loading || state.isRecording}
          className="mode-dropdown"
          aria-label="Select input mode"
        >
          <option value="text">Text</option>
          <option value="voice">Voice</option>
        </select>
      </div>

      {mode === 'text' ? (
        <div className="text-input-container">
          <form onSubmit={handleSendText} className="text-input-form">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="text-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !textInput.trim()}
              className="send-btn"
              aria-label="Send message"
            >
              Send
            </button>
          </form>
          <div className="character-count">
            {textInput.length} characters
          </div>
        </div>
      ) : (
        <div className="voice-controls">
          {state.isRecording ? (
            <div className="recording-state">
              <div
                className="recording-badge"
                aria-live="polite"
                aria-label={`Recording: ${formatTime(state.time)}`}
              >
                <span className="recording-indicator"></span>
                Recording: {formatTime(state.time)}
              </div>
              <button
                onClick={stopRecording}
                className="voice-btn recording"
                aria-label="Stop recording"
              >
                STOP
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              disabled={loading || state.isProcessing}
              className="voice-btn"
              aria-label="Start voice recording"
              title="Record your message (max 60 seconds)"
            >
              {state.isProcessing ? 'Processing...' : 'SPEAK'}
            </button>
          )}

          {state.transcript && !state.isProcessing && (
            <div className="transcript-preview">
              <label className="transcript-label">Transcript:</label>
              <p className="transcript-text">{state.transcript}</p>
              <button
                onClick={() => updateState({ transcript: '' })}
                className="btn btn-tertiary"
                aria-label="Clear transcript"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
