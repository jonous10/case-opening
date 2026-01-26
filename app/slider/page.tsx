"use client";

import React, { useEffect, useState, useRef } from "react";

class Skin {
  name: string;
  image: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  weapon?: { name: string };
  category?: { id: string; name: string };

  constructor(
    name: string,
    image: string,
    rarity: { id: string; name: string; color: string },
    weapon?: { name: string },
    category?: { id: string; name: string }
  ) {
    this.name = name;
    this.image = image;
    this.rarity = rarity;
    if (weapon) this.weapon = weapon;
    if (category) this.category = category;
  }
}

export default function CS2CasePage() {
  // Configuration variables - change these to adjust the case opener
  const [itemWidth] = useState<number>(120);
  const itemGap = 12;
  const reelLength = 300;
  const minLandingIndex = 280;
  const maxLandingIndex = 295;
  const animationDuration = 7000;
  const animationDelay = 100;
  
  const [skins, setSkins] = useState<Skin[]>([]);
  const [reelSkins, setReelSkins] = useState<Skin[]>([]);
  const [rolling, setRolling] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const openAudioRef = useRef<HTMLAudioElement | null>(null);
  const keyAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  const rarityWeights: Record<string, number> = {
    "Consumer": 79,
    "Industrial": 15,
    "Mil-Spec": 4,
    "Restricted": 1,
    "Classified": 0.25,
    "Covert": 1,


    "Extraordinary": 0.001,
  };

  // Separate weights for special categories
  const categoryWeights: Record<string, number> = {
    "Knives": 26,      // ~0.26% per knife (rarer than normal Covert)
    "Gloves": 26,      // ~0.26% per glove (same as knives)
  };

  function getRandomSkin(skins: Skin[]): Skin {
    // Separate skins by category
    const knives = skins.filter(s => s.category?.name === "Knives");
    const gloves = skins.filter(s => s.category?.name === "Gloves");
    const regularSkins = skins.filter(s => 
      s.category?.id !== "sfui_invpanel_filter_melee" && 
      s.category?.id !== "sfui_invpanel_filter_gloves"
    );

    // Debug logging (remove after testing)
    if (knives.length === 0) {
      console.warn("No knives found in filter!");
    }

    // Calculate total weight including special categories
    const regularWeight = regularSkins.reduce(
      (sum, skin) => sum + (rarityWeights[skin.rarity.name] || 1),
      0
    );
    const knifeWeight = knives.length > 0 ? categoryWeights["Knives"] : 0;
    const gloveWeight = gloves.length > 0 ? categoryWeights["Gloves"] : 0;
    const totalWeight = regularWeight + knifeWeight + gloveWeight;

    let random = Math.random() * totalWeight;

    // Check if we hit a knife
    if (knives.length > 0 && random <= knifeWeight) {
      const selectedKnife = knives[Math.floor(Math.random() * knives.length)];
      console.log("KNIFE DROPPED:", selectedKnife.name);
      return selectedKnife;
    }
    random -= knifeWeight;

    // Check if we hit gloves
    if (gloves.length > 0 && random <= gloveWeight) {
      return gloves[Math.floor(Math.random() * gloves.length)];
    }
    random -= gloveWeight;

    // Otherwise, select from regular skins based on rarity
    for (const skin of regularSkins) {
      random -= rarityWeights[skin.rarity.name] || 1;
      if (random <= 0) return skin;
    }

    return regularSkins[regularSkins.length - 1] || skins[0];
  }

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
    )
      .then((res) => res.json())
      .then((data) => {
        const skinObjects = data.map(
          (s: any) =>
            new Skin(s.name, s.image, s.rarity, s.weapon ? s.weapon : undefined, s.category)
        );
        setSkins(skinObjects);
      })
      .catch((err) => console.error(err));
    
    // Initialize audio element for tick sound
    // Replace '/tick.mp3' with your actual sound file path
    tickAudioRef.current = new Audio('/caseTick.mp3');
    tickAudioRef.current.volume = 0.3; // Adjust volume (0.0 to 1.0)

    openAudioRef.current = new Audio('/caseOpen.mp3');
    openAudioRef.current.volume = 0.3; // Adjust volume (0.0 to 1.0)
    
    keyAudioRef.current = new Audio('/caseTick.mp3');
    keyAudioRef.current.volume = 0.3; // Adjust volume (0.0 to 1.0)
  }, []);

  // Play tick sound
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start for rapid plays
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };
  // Monitor reel position and play tick sounds
  useEffect(() => {
    if (!rolling || !reelRef.current) return;

    const interval = setInterval(() => {
      if (!reelRef.current) return;

      // Get current transform value
      const transform = window.getComputedStyle(reelRef.current).transform;
      if (transform === 'none') return;

      // Parse translateX value
      const matrix = new DOMMatrix(transform);
      const translateX = Math.abs(matrix.m41);

      // Calculate which item is currently at center
      const containerWidth = reelRef.current.offsetWidth || 800;
      const centerPosition = containerWidth / 2;
      const itemTotalWidth = itemWidth + itemGap;
      
      const currentCenterIndex = Math.floor((translateX + centerPosition) / itemTotalWidth);

      // Play sound when crossing into a new item
      if (currentCenterIndex !== lastTickIndexRef.current && currentCenterIndex >= 0) {
        playSound(tickAudioRef);
        lastTickIndexRef.current = currentCenterIndex;
      }
    }, 16); // ~60fps checking

    return () => clearInterval(interval);
  }, [rolling, itemWidth, itemGap]);

  const findClosestSkin = (translateX: number, reelArray: Skin[]) => {
    const containerWidth = reelRef.current?.offsetWidth || 800;
    const centerPosition = containerWidth / 2;
    const itemTotalWidth = itemWidth + itemGap;
    
    let closestIndex = 0;
    let smallestDistance = Infinity;
    
    for (let i = 0; i < reelArray.length; i++) {
      const itemCenter = (i * itemTotalWidth + itemWidth / 2) - translateX;
      const distanceFromCenter = Math.abs(itemCenter - centerPosition);
      
      if (distanceFromCenter < smallestDistance) {
        smallestDistance = distanceFromCenter;
        closestIndex = i;
      }
    }
    
    return reelArray[closestIndex];
  };

  const startRoll = () => {
    if (rolling || skins.length === 0) return;

    setRolling(true);
    setSelectedSkin(null);
    setShowReveal(false);
    lastTickIndexRef.current = -1; // Reset tick counter

    const reelArray: Skin[] = [];
    const nonKnifeSkins = skins.filter(s => s.category?.name !== "Knives");

    for (let i = 0; i < reelLength; i++) {
      const skin = getRandomSkin(nonKnifeSkins);
      reelArray.push(skin);
    }

    setReelSkins(reelArray);

    const itemTotalWidth = itemWidth + itemGap;
    const containerWidth = reelRef.current?.offsetWidth || 800;
    const centerPosition = containerWidth / 2;
    
    const randomIndex = minLandingIndex + Math.random() * (maxLandingIndex - minLandingIndex);
    const randomOffsetFraction = (Math.random() - 0.5) * 0.8;
    const finalTranslateDistance = (randomIndex * itemTotalWidth + itemWidth / 2) - centerPosition + (randomOffsetFraction * itemWidth);

    if (reelRef.current) {
      reelRef.current.style.transition = "none";
      reelRef.current.style.transform = "translateX(0)";
    }

    setTimeout(() => {
      if (reelRef.current) {
        reelRef.current.style.transition =
          `transform ${animationDuration}ms cubic-bezier(0.15, 0.85, 0.3, 1)`;
        reelRef.current.style.transform = `translateX(-${finalTranslateDistance}px)`;
      }
    }, animationDelay);

    setTimeout(() => {
      const actualWinner = findClosestSkin(finalTranslateDistance, reelArray);
      setSelectedSkin(actualWinner);
      setRolling(false);
      
      // Show reveal animation after a brief delay
      setTimeout(() => {
        setShowReveal(true);
      playSound(openAudioRef);
      }, 400);
    }, animationDuration + animationDelay);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      {/* Header - always visible */}
      <div className="relative z-20 text-center mb-8">
        <h1 className="text-6xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-3 tracking-tight"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          CASE OPENER
        </h1>
        <p className="text-slate-400 text-sm tracking-widest uppercase">Counter-Strike 2</p>
      </div>

      <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        {/* Main content area */}
        <div className="relative w-full" style={{ minHeight: '400px' }}>
          {/* Reel container - hides when showing reveal */}
          <div 
            className="transition-all duration-700 ease-out"
            style={{
              opacity: showReveal ? 0 : 1,
              transform: showReveal ? 'scale(0.95) translateY(-20px)' : 'scale(1) translateY(0)',
              pointerEvents: showReveal ? 'none' : 'auto'
            }}
          >
            <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-6 shadow-2xl shadow-amber-500/10">
              <div ref={reelRef} className="flex flex-row items-center justify-start py-4">
                {reelSkins.map((skin, index) => (
                  <div
                    key={index}
                    className="rounded-xl flex-shrink-0 overflow-hidden relative group"
                    style={{ 
                      width: `${itemWidth}px`,
                      height: `${itemWidth}px`,
                      marginRight: `${itemGap}px`,
                      background: `linear-gradient(135deg, ${skin.rarity.color}15, ${skin.rarity.color}05)`,
                      border: `2px solid ${skin.rarity.color}40`,
                      boxShadow: `0 0 20px ${skin.rarity.color}20`
                    }}
                  >
                    <img
                      src={skin.image}
                      alt={skin.name}
                      className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
              
              {/* Center indicator line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-b from-transparent via-amber-400 to-transparent opacity-80"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-amber-400 shadow-lg shadow-amber-400/50"></div>
              </div>
            </div>
          </div>

          {/* Reveal card - shows on top when animation completes */}
          {selectedSkin && showReveal && (
            <div 
              className="absolute inset-0 flex items-center justify-center reveal-container"
            >
              <style jsx>{`
                .reveal-container {
                  animation: revealFade 0.7s ease-out forwards;
                }
                @keyframes revealFade {
                  0% {
                    opacity: 0;
                    transform: scale(0.8) rotateY(90deg);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1) rotateY(0deg);
                  }
                }
                :global(.glow-pulse) {
                  animation: glow 2s ease-in-out infinite;
                }
                @keyframes glow {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 1; }
                }
                :global(.float-img) {
                  animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
              
              <div 
                className="relative rounded-3xl p-8 max-w-md w-full"
                style={{
                  background: `linear-gradient(135deg, ${selectedSkin.rarity.color}10, ${selectedSkin.rarity.color}05)`,
                  border: `3px solid ${selectedSkin.rarity.color}`,
                  boxShadow: `0 0 60px ${selectedSkin.rarity.color}40, 0 0 100px ${selectedSkin.rarity.color}20, inset 0 0 40px ${selectedSkin.rarity.color}10`
                }}
              >
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 rounded-3xl glow-pulse pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${selectedSkin.rarity.color}20, transparent 70%)`,
                  }}
                ></div>

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-4"
                         style={{ 
                           background: `${selectedSkin.rarity.color}30`,
                           color: selectedSkin.rarity.color,
                           border: `1px solid ${selectedSkin.rarity.color}60`
                         }}>
                      {selectedSkin.rarity.name.toUpperCase()}
                    </div>
                    
                    <div className="relative w-full h-64 mb-6 flex items-center justify-center">
                      <img
                        src={selectedSkin.image}
                        alt={selectedSkin.name}
                        className="max-w-full max-h-full object-contain drop-shadow-2xl float-img"
                        style={{
                          filter: `drop-shadow(0 0 30px ${selectedSkin.rarity.color}80)`
                        }}
                      />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                      {selectedSkin.name}
                    </h2>
                    {selectedSkin.weapon && (
                      <p className="text-slate-400 text-sm tracking-wide">
                        {selectedSkin.weapon.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats or info section */}
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

      {/* Action button - always visible and in same position */}
      <div className="relative z-20 mt-8 flex justify-center">
        <button
          onClick={startRoll}
          disabled={rolling}
          className="group relative px-12 py-4 text-lg font-bold tracking-wide rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: rolling 
              ? 'linear-gradient(135deg, #78716c, #57534e)' 
              : 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
            boxShadow: rolling 
              ? 'none' 
              : '0 10px 40px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)',
            transform: rolling ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          <span className="relative z-10 text-slate-950 flex items-center gap-3">
            {rolling ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                OPENING...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                OPEN CASE
              </>
            )}
          </span>
          
          {/* Hover glow effect */}
          {!rolling && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          )}
        </button>
      </div>
    </div>
  );
}