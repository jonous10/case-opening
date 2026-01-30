/**
 * CaseReel Component
 * The scrolling reel of skins during case opening
 */
import { forwardRef } from 'react';
import { Skin } from '../types/Skin';

interface CaseReelProps {
  reelSkins: Skin[];
  itemWidth: number;
  itemGap: number;
}

export default forwardRef<HTMLDivElement, CaseReelProps>(function CaseReel(
  { reelSkins, itemWidth, itemGap },
  ref
) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-6 shadow-2xl shadow-amber-500/10">
      {/* Scrolling container */}
      <div ref={ref} className="flex flex-row items-center justify-start py-4">
        {reelSkins.map((skin, index) => (
          <div
            key={index}
            className="rounded-xl flex-shrink-0 overflow-hidden"
            style={{
              width: itemWidth,
              height: itemWidth,
              marginRight: itemGap,
              background: `linear-gradient(135deg, ${skin.rarity.color}20, ${skin.rarity.color}05)`,
              borderBottom: `4px solid ${skin.rarity.color}80`,
              boxShadow: `0 0 20px ${skin.rarity.color}20`
            }}
          >
            <img
              src={skin.image}
              alt={skin.name}
              className="w-full h-full object-contain p-2"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Center indicator line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-amber-400 to-transparent opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-amber-400 shadow-lg shadow-amber-400/50" />
      </div>
    </div>
  );
});