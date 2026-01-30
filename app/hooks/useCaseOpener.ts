/**
 * Case Opener Hook
 * Manages the reel animation and skin selection logic
 */
import { useState, useRef } from 'react';
import { Skin } from '../types/Skin';
import { getRandomSkin } from '../utils/RarityCalculator';

interface CaseOpenerConfig {
  itemWidth: number;
  itemGap: number;
  reelLength: number;       // Total items in the reel
  minLandingIndex: number;  // Where the reel can stop (min)
  maxLandingIndex: number;  // Where the reel can stop (max)
  animationDuration: number; // How long the spin takes (ms)
  animationDelay: number;    // Delay before starting animation (ms)
}

export function useCaseOpener(config: CaseOpenerConfig) {
  const [reelSkins, setReelSkins] = useState<Skin[]>([]);
  const [rolling, setRolling] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const reelRef = useRef<HTMLDivElement>(null);
  const lastTickIndexRef = useRef<number>(-1);

  // Find which skin is closest to center at a given translate position
  const findClosestSkin = (translateX: number, reelArray: Skin[]) => {
    const containerWidth = reelRef.current?.offsetWidth || 800;
    const centerPosition = containerWidth / 2;
    const itemTotalWidth = config.itemWidth + config.itemGap;

    let closestIndex = 0;
    let smallestDistance = Infinity;

    for (let i = 0; i < reelArray.length; i++) {
      const itemCenter = (i * itemTotalWidth + config.itemWidth / 2) - translateX;
      const distanceFromCenter = Math.abs(itemCenter - centerPosition);

      if (distanceFromCenter < smallestDistance) {
        smallestDistance = distanceFromCenter;
        closestIndex = i;
      }
    }

    return reelArray[closestIndex];
  };

  // Start spinning the reel
  const startRoll = (
    skins: Skin[],
    playSound: (audioRef: React.RefObject<HTMLAudioElement | null>) => void,
    openAudioRef: React.RefObject<HTMLAudioElement | null>
  ) => {
    if (rolling || skins.length === 0) return;

    // Reset state
    setRolling(true);
    setSelectedSkin(null);
    setShowReveal(false);
    lastTickIndexRef.current = -1;

    // Generate random skins for the reel
    const reelArray: Skin[] = [];
    for (let i = 0; i < config.reelLength; i++) {
      reelArray.push(getRandomSkin(skins));
    }
    setReelSkins(reelArray);

    // Calculate where to stop
    const itemTotalWidth = config.itemWidth + config.itemGap;
    const containerWidth = reelRef.current?.offsetWidth || 800;
    const centerPosition = containerWidth / 2;

    const randomIndex = config.minLandingIndex + Math.random() * (config.maxLandingIndex - config.minLandingIndex);
    const randomOffset = (Math.random() - 0.5) * 0.8 * config.itemWidth;
    const finalTranslate = (randomIndex * itemTotalWidth + config.itemWidth / 2) - centerPosition + randomOffset;

    // Reset position instantly, then animate
    if (reelRef.current) {
      reelRef.current.style.transition = 'none';
      reelRef.current.style.transform = 'translateX(0)';
    }

    // Start animation after delay
    setTimeout(() => {
      if (reelRef.current) {
        reelRef.current.style.transition = `transform ${config.animationDuration}ms cubic-bezier(0.15, 0.85, 0.3, 1)`;
        reelRef.current.style.transform = `translateX(-${finalTranslate}px)`;
      }
    }, config.animationDelay);

    // Handle animation end
    setTimeout(() => {
      const winner = findClosestSkin(finalTranslate, reelArray);
      setSelectedSkin(winner);
      setRolling(false);

      // Show reveal after a short pause
      setTimeout(() => {
        setShowReveal(true);
        playSound(openAudioRef);
      }, 400);
    }, config.animationDuration + config.animationDelay);
  };

  return {
    reelSkins,
    rolling,
    selectedSkin,
    showReveal,
    reelRef,
    lastTickIndexRef,
    startRoll
  };
}
