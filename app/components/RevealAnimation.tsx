/**
 * RevealAnimation Component
 * Shows the won skin with a fancy reveal animation
 */
import { Skin } from '../types/Skin';

interface RevealAnimationProps {
  selectedSkin: Skin | null;
  showReveal: boolean;
}

export default function RevealAnimation({ selectedSkin, showReveal }: RevealAnimationProps) {
  if (!selectedSkin || !showReveal) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Keyframe animations */}
      <style jsx>{`
        .reveal-enter {
          animation: revealIn 0.7s ease-out forwards;
        }
        @keyframes revealIn {
          from { opacity: 0; transform: scale(0.8) rotateY(90deg); }
          to { opacity: 1; transform: scale(1) rotateY(0deg); }
        }
        .glow-pulse {
          animation: glowPulse 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div
        className="relative rounded-3xl p-8 max-w-md w-full reveal-enter"
        style={{
          background: `linear-gradient(135deg, ${selectedSkin.rarity.color}10, ${selectedSkin.rarity.color}05)`,
          borderBottom: `8px solid ${selectedSkin.rarity.color}`,
          boxShadow: `0 0 60px ${selectedSkin.rarity.color}40, 0 0 100px ${selectedSkin.rarity.color}20`
        }}
      >
        {/* Pulsing glow background */}
        <div
          className="absolute inset-0 rounded-3xl glow-pulse pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${selectedSkin.rarity.color}20, transparent 70%)` }}
        />

        <div className="relative z-10 text-center">
          {/* Rarity badge */}
          <div
            className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-4"
            style={{
              background: `${selectedSkin.rarity.color}30`,
              color: selectedSkin.rarity.color,
              border: `1px solid ${selectedSkin.rarity.color}60`
            }}
          >
            {selectedSkin.rarity.name.toUpperCase()}
          </div>

          {/* Floating skin image */}
          <div className="w-full h-64 mb-6 flex items-center justify-center">
            <img
              src={selectedSkin.image}
              alt={selectedSkin.name}
              className="max-w-full max-h-full object-contain drop-shadow-2xl float"
              style={{ filter: `drop-shadow(0 0 30px ${selectedSkin.rarity.color}80)` }}
            />
          </div>

          {/* Skin name */}
          <h2 className="text-2xl font-bold text-white mb-2">{selectedSkin.name}</h2>
          {selectedSkin.weapon && (
            <p className="text-slate-400 text-sm">{selectedSkin.weapon.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
