"use client";

import React, { useEffect, useState } from "react";
import CaseReel from "./components/CaseReel";
import RevealAnimation from "./components/RevealAnimation";
import OpenButton from "./components/OpenButton";
import Inventory from "./components/Inventory";
import { useSkins } from "./hooks/useSkins";
import { useAudio } from "./hooks/useAudio";
import { useCaseOpener } from "./hooks/useCaseOpener";
import { useInventory } from "./hooks/useInventory";
import { Skin } from "./types/Skin";

export default function CS2CasePage() {
  // Configuration variables - change these to adjust the case opener
  const itemWidth = 220;
  const itemGap = 6;
  const reelLength = 300;
  const minLandingIndex = 280;
  const maxLandingIndex = 295;
  const animationDuration = 7000;
  const animationDelay = 100;

  // Custom hooks
  const skins = useSkins();
  const { tickAudioRef, openAudioRef, playSound } = useAudio();
  const { addToInventory, inventory, removeFromInventory, getInventoryStats, isLoading } = useInventory();
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

  // State for inventory modal
  const [showInventory, setShowInventory] = React.useState(false);
  



  // State for auto roll
  const [autoRoll, setAutoRoll] = React.useState(false);

  // Track the last added skin to prevent duplicates
  const [lastAddedSkin, setLastAddedSkin] = React.useState<string | null>(null);

  // Add skin to inventory when it's revealed (only once per skin)
  useEffect(() => {
    if (selectedSkin && showReveal && !rolling) {
      // Only add if this is a different skin than the last one added
      if (lastAddedSkin !== selectedSkin.name) {
        addToInventory(selectedSkin, 'case');
        setLastAddedSkin(selectedSkin.name);
      }
    }
  }, [selectedSkin, showReveal, rolling, addToInventory, lastAddedSkin]);

  // Auto roll functionality
  useEffect(() => {
    if (autoRoll && selectedSkin && showReveal && !rolling) {
      // Start a new roll after a short delay when auto-roll is enabled
      const timer = setTimeout(() => {
        handleStartRoll();
      }, 1000); // 1.5 second delay before next roll
      
      return () => clearTimeout(timer);
    }
  }, [autoRoll, selectedSkin, showReveal, rolling]);

  const handleToggleAutoRoll = () => {
    setAutoRoll(!autoRoll);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 p-2 relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-4 shadow-2xl shadow-amber-500/10 transition-transform">
        <div className="flex justify-center items-start max-w-7xl mx-auto relative">
          <div className="flex-1 text-center">
            <h1 className="text-6xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-3 tracking-tight"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              CASE OPENER
            </h1>
            <p className="text-slate-400 text-sm tracking-widest uppercase">Counter-Strike 2</p>
          </div>
          <button
            onClick={() => setShowInventory(true)}
            className="absolute top-0 right-0 m-4 relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-4 shadow-2xl shadow-amber-500/10 hover:scale-105 transition-transform"
            title="Open Inventory"
          >
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full" style={{ minHeight: '400px' }}>
            <div 
              className="transition-all duration-700 ease-out "
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

        <OpenButton 
          rolling={rolling} 
          onStartRoll={handleStartRoll} 
          autoRoll={autoRoll}
          onToggleAutoRoll={handleToggleAutoRoll}
        />
      </div>
      
      <Inventory 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
        inventory={inventory}
        removeFromInventory={removeFromInventory}
        addToInventory={addToInventory}
        getInventoryStats={getInventoryStats}
        isLoading={isLoading}
      />
    </div>
  );
}
