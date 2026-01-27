"use client";

import React, { useEffect } from "react";
import CaseReel from "./components/CaseReel";
import RevealAnimation from "./components/RevealAnimation";
import OpenButton from "./components/OpenButton";
import { useSkins } from "./hooks/useSkins";
import { useAudio } from "./hooks/useAudio";
import { useCaseOpener } from "./hooks/useCaseOpener";
import { Skin } from "./types/Skin";

export default function CS2CasePage() {
  // Configuration variables - change these to adjust the case opener
  const itemWidth = 120;
  const itemGap = 12;
  const reelLength = 300;
  const minLandingIndex = 280;
  const maxLandingIndex = 295;
  const animationDuration = 7000;
  const animationDelay = 100;

  // Custom hooks
  const skins = useSkins();
  const { tickAudioRef, openAudioRef, playSound } = useAudio();
  const {
    reelSkins,
    rolling,
    selectedSkin,
    showReveal,
    reelRef,
    lastTickIndexRef,
    startRoll
  } = useCaseOpener({
    itemWidth,
    itemGap,
    reelLength,
    minLandingIndex,
    maxLandingIndex,
    animationDuration,
    animationDelay
  });

  // Monitor reel position and play tick sounds
  useEffect(() => {
    if (!rolling || !reelRef.current) return;

    const interval = setInterval(() => {
      if (!reelRef.current) return;

      const transform = window.getComputedStyle(reelRef.current).transform;
      if (transform === 'none') return;

      const matrix = new DOMMatrix(transform);
      const translateX = Math.abs(matrix.m41);

      const containerWidth = reelRef.current.offsetWidth || 800;
      const centerPosition = containerWidth / 2;
      const itemTotalWidth = itemWidth + itemGap;
      
      const currentCenterIndex = Math.floor((translateX + centerPosition) / itemTotalWidth);

      if (currentCenterIndex !== lastTickIndexRef.current && currentCenterIndex >= 0) {
        playSound(tickAudioRef);
        lastTickIndexRef.current = currentCenterIndex;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [rolling, itemWidth, itemGap, playSound, tickAudioRef, lastTickIndexRef]);

  const handleStartRoll = () => {
    startRoll(skins, playSound, openAudioRef);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-20 text-center mb-8">
        <h1 className="text-6xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-3 tracking-tight"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          CASE OPENER
        </h1>
        <p className="text-slate-400 text-sm tracking-widest uppercase">Counter-Strike 2</p>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full" style={{ minHeight: '400px' }}>
          <div 
            className="transition-all duration-700 ease-out"
            style={{
              opacity: showReveal ? 0 : 1,
              transform: showReveal ? 'scale(0.95) translateY(-20px)' : 'scale(1) translateY(0)',
              pointerEvents: showReveal ? 'none' : 'auto'
            }}
          >
            <CaseReel ref={reelRef} reelSkins={reelSkins} itemWidth={itemWidth} itemGap={itemGap}/>
          </div>

          <RevealAnimation selectedSkin={selectedSkin} showReveal={showReveal} />
        </div>

        {!showReveal && selectedSkin && !rolling && (
          <div className="mt-8 text-center fade-in-text">
            <style jsx>{`
              .fade-in-text {
                opacity: 0;
                animation: fadeIn 0.5s ease-out 0.3s forwards;
              }
              @keyframes fadeIn {
                from { 
                  opacity: 0; 
                  transform: translateY(10px); 
                }
                to { 
                  opacity: 1; 
                  transform: translateY(0); 
                }
              }
            `}</style>
            <p className="text-slate-500 text-sm">
              Last drop: <span style={{ color: selectedSkin.rarity.color }} className="font-semibold">{selectedSkin.name}</span>
            </p>
          </div>
        )}
      </div>

      <OpenButton rolling={rolling} onStartRoll={handleStartRoll} />
    </div>
  );
}