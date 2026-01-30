/**
 * Audio Hook
 * Manages sound effects for the case opener (tick and open sounds)
 */
import { useRef, useEffect } from 'react';

export function useAudio() {
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const openAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements on mount
  useEffect(() => {
    tickAudioRef.current = new Audio('/caseTick.mp3');
    tickAudioRef.current.volume = 0.3;

    openAudioRef.current = new Audio('/caseOpen.mp3');
    openAudioRef.current.volume = 0.3;
  }, []);

  // Play a sound from the given audio ref
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(() => { }); // Ignore autoplay errors
    }
  };

  return { tickAudioRef, openAudioRef, playSound };
}
