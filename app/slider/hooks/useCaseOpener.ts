import { useState, useRef, useEffect } from 'react';
import { Skin } from '../types/Skin';
import { getRandomSkin } from '../utils/RarityCalculator';

interface CaseOpenerConfig {
  itemWidth: number;
  itemGap: number;
  reelLength: number;
  minLandingIndex: number;
  maxLandingIndex: number;
  animationDuration: number;
  animationDelay: number;
}

export function useCaseOpener(config: CaseOpenerConfig) {
  const [reelSkins, setReelSkins] = useState<Skin[]>([]);
  const [rolling, setRolling] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const lastTickIndexRef = useRef<number>(-1);

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

  const startRoll = (skins: Skin[], playSound: (audioRef: React.RefObject<HTMLAudioElement | null>) => void, openAudioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (rolling || skins.length === 0) return;

    setRolling(true);
    setSelectedSkin(null);
    setShowReveal(false);
    lastTickIndexRef.current = -1;

    const reelArray: Skin[] = [];
    for (let i = 0; i < config.reelLength; i++) {
      const skin = getRandomSkin(skins);
      reelArray.push(skin);
    }

    setReelSkins(reelArray);

    const itemTotalWidth = config.itemWidth + config.itemGap;
    const containerWidth = reelRef.current?.offsetWidth || 800;
    const centerPosition = containerWidth / 2;
    
    const randomIndex = config.minLandingIndex + Math.random() * (config.maxLandingIndex - config.minLandingIndex);
    const randomOffsetFraction = (Math.random() - 0.5) * 0.8;
    const finalTranslateDistance = (randomIndex * itemTotalWidth + config.itemWidth / 2) - centerPosition + (randomOffsetFraction * config.itemWidth);

    if (reelRef.current) {
      reelRef.current.style.transition = "none";
      reelRef.current.style.transform = "translateX(0)";
    }

    setTimeout(() => {
      if (reelRef.current) {
        reelRef.current.style.transition =
          `transform ${config.animationDuration}ms cubic-bezier(0.15, 0.85, 0.3, 1)`;
        reelRef.current.style.transform = `translateX(-${finalTranslateDistance}px)`;
      }
    }, config.animationDelay);

    setTimeout(() => {
      const actualWinner = findClosestSkin(finalTranslateDistance, reelArray);
      setSelectedSkin(actualWinner);
      setRolling(false);
      
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
