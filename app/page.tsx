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

const CONFIG = {
  itemWidth: 220,
  itemGap: 6,
  reelLength: 300,
  minLandingIndex: 280,
  maxLandingIndex: 295,
  animationDuration: 7000,
  animationDelay: 100,
};

export default function CS2CasePage() {
  const skins = useSkins();
  const { tickAudioRef, openAudioRef, playSound } = useAudio();
  const {
    addToInventory,
    inventory,
    removeFromInventory,
    getInventoryStats,
    isLoading,
  } = useInventory();
  const {
    reelSkins,
    rolling,
    selectedSkin,
    showReveal,
    reelRef,
    lastTickIndexRef,
    startRoll,
  } = useCaseOpener(CONFIG);

  const [showInventory, setShowInventory] = useState(false);
  const [autoRoll, setAutoRoll] = useState(false);
  const [lastAddedSkin, setLastAddedSkin] = useState<string | null>(null);

  // Add skin to inventory when revealed
  useEffect(() => {
    if (
      selectedSkin &&
      showReveal &&
      !rolling &&
      lastAddedSkin !== selectedSkin.name
    ) {
      addToInventory(selectedSkin, "case");
      setLastAddedSkin(selectedSkin.name);
    }
  }, [selectedSkin, showReveal, rolling, addToInventory, lastAddedSkin]);

  // Auto-roll: start new roll after reveal
  useEffect(() => {
    if (autoRoll && selectedSkin && showReveal && !rolling) {
      const timer = setTimeout(
        () => startRoll(skins, playSound, openAudioRef),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [
    autoRoll,
    selectedSkin,
    showReveal,
    rolling,
    skins,
    playSound,
    openAudioRef,
    startRoll,
  ]);

  // Play tick sound as reel spins
  useEffect(() => {
    if (!rolling || !reelRef.current) return;

    const interval = setInterval(() => {
      if (!reelRef.current) return;

      const transform = window.getComputedStyle(reelRef.current).transform;
      if (transform === "none") return;

      const matrix = new DOMMatrix(transform);
      const translateX = Math.abs(matrix.m41);
      const itemTotalWidth = CONFIG.itemWidth + CONFIG.itemGap;
      const centerPosition = (reelRef.current.offsetWidth || 800) / 2;
      const currentIndex = Math.floor(
        (translateX + centerPosition) / itemTotalWidth,
      );

      if (currentIndex !== lastTickIndexRef.current && currentIndex >= 0) {
        playSound(tickAudioRef);
        lastTickIndexRef.current = currentIndex;
      }
    }, 16);

    return () => clearInterval(interval);
  }, [rolling, playSound, tickAudioRef, lastTickIndexRef, reelRef]);

  const handleStartRoll = () => startRoll(skins, playSound, openAudioRef);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="relative z-20 border-b border-amber-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm py-6">
        <div className="flex items-center justify-center relative max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-6xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-2 tracking-tight">
              CASE OPENER
            </h1>
            <p className="text-slate-400 text-sm tracking-widest uppercase">
              Counter-Strike 2
            </p>
          </div>

          {/* Inventory button */}
          <button
            onClick={() => setShowInventory(true)}
            className="absolute right-4 rounded-xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-sm p-3 hover:bg-slate-800 hover:scale-105 transition-all"
            title="Open Inventory"
          >
            <svg
              className="w-6 h-6 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full" style={{ minHeight: "400px" }}>
            {/* Case reel (fades out when revealing) */}
            <div
              className="transition-all duration-700 ease-out"
              style={{
                opacity: showReveal ? 0 : 1,
                transform: showReveal
                  ? "scale(0.95) translateY(-20px)"
                  : "scale(1) translateY(0)",
                pointerEvents: showReveal ? "none" : "auto",
              }}
            >
              <CaseReel
                ref={reelRef}
                reelSkins={reelSkins}
                itemWidth={CONFIG.itemWidth}
                itemGap={CONFIG.itemGap}
              />
            </div>

            {/* Win reveal animation */}
            <RevealAnimation
              selectedSkin={selectedSkin}
              showReveal={showReveal}
            />
          </div>

          {/* Last drop text */}
          {!showReveal && selectedSkin && !rolling && (
            <p className="mt-8 text-slate-500 text-sm animate-fade-in">
              Last drop:{" "}
              <span
                style={{ color: selectedSkin.rarity.color }}
                className="font-semibold"
              >
                {selectedSkin.name}
              </span>
            </p>
          )}
        </div>

        <OpenButton
          rolling={rolling}
          onStartRoll={handleStartRoll}
          autoRoll={autoRoll}
          onToggleAutoRoll={() => setAutoRoll(!autoRoll)}
        />
      </main>

      {/* Inventory modal */}
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
