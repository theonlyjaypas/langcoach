import { useRef, useCallback, useState } from 'react';
import { useToast } from '../components/Toast';

interface UseAudioPlaybackOptions {
  onComplete?: () => void;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { show: showToast } = useToast();

  const play = useCallback(
    async (text: string) => {
      try {
        setIsPlaying(true);
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Text-to-speech failed');
        }

        const data = await response.json();

        if (!data || !data.audio) {
          throw new Error('No audio data received');
        }

        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = url;
        audioRef.current.volume = 1.0;

        audioRef.current.onended = () => {
          URL.revokeObjectURL(url);
          setIsPlaying(false);
          options.onComplete?.();
        };

        audioRef.current.onerror = () => {
          URL.revokeObjectURL(url);
          setIsPlaying(false);
          showToast('Audio playback error', 'error');
        };

        await audioRef.current.play();
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          showToast(
            err instanceof Error ? err.message : 'Playback failed',
            'error'
          );
        }
        setIsPlaying(false);
      }
    },
    [showToast]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    abortControllerRef.current?.abort();
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}
