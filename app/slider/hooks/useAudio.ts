import { useRef, useEffect } from 'react';

export function useAudio() {
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const openAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    tickAudioRef.current = new Audio('/caseTick.mp3');
    tickAudioRef.current.volume = 0.3;

    openAudioRef.current = new Audio('/caseOpen.mp3');
    openAudioRef.current.volume = 0.3;
  }, []);

  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  return {
    tickAudioRef,
    openAudioRef,
    playSound
  };
}
