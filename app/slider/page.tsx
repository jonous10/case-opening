'use client';

import { useEffect, useRef, useState } from 'react';

/* =======================
   CONFIG
======================= */
const REEL_ITEM_WIDTH = 320;
const REEL_ITEM_GAP = 8;
const REEL_ITEM_TOTAL = REEL_ITEM_WIDTH + REEL_ITEM_GAP;

const REEL_ITEMS_COUNT = 50;      // number of items in the reel
const WINNING_ITEM_INDEX = 30;    // index that will stop under marker

const REEL_INITIAL_SPEED = 40;    // starting px/frame speed
const REEL_DECELERATION = 0.985;  // deceleration multiplier per frame

const STOP_THRESHOLD = 1;         // px distance threshold for stopping
const MIN_SPEED = 0.3;            // px/frame minimum speed before stopping

/* =======================
   TYPES
======================= */
interface Rarity {
  id: string;
  name: string;
  color: string;
}

interface Skin {
  name: string;
  image: string;
  rarity: Rarity;
}

/* =======================
   COMPONENT
======================= */
export default function Home() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [reelItems, setReelItems] = useState<
    { id: string; skin: Skin; x: number }[]
  >([]);
  const [finalSkin, setFinalSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const anim = useRef({
    spinning: false,
    distance: 0,
    target: 0,
    speed: REEL_INITIAL_SPEED,
    items: [] as { id: string; skin: Skin; index: number }[],
    winner: null as Skin | null,
  });

  /* =======================
     LOAD SKINS
  ======================= */
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'
    )
      .then((r) => r.json())
      .then(setSkins)
      .finally(() => setLoading(false));
  }, []);

  /* =======================
     SPIN LOGIC
  ======================= */
  const spin = () => {
    if (!skins.length || anim.current.spinning) return;

    const a = anim.current;
    a.spinning = true;
    a.distance = 0;
    a.speed = REEL_INITIAL_SPEED;
    setFinalSkin(null);

    // 🎯 Pick winner first
    const winner = skins[Math.floor(Math.random() * skins.length)];
    a.winner = winner;

    // 🎰 Build reel
    a.items = Array.from({ length: REEL_ITEMS_COUNT }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      index: i,
      skin:
        i === WINNING_ITEM_INDEX
          ? winner
          : skins[Math.floor(Math.random() * skins.length)],
    }));

    // 📐 Calculate exact stopping distance
    const containerWidth = containerRef.current?.offsetWidth ?? 900;
    const centerX = containerWidth / 2;
    a.target = WINNING_ITEM_INDEX * REEL_ITEM_TOTAL - centerX + REEL_ITEM_WIDTH / 2;

    // 🎞 Animation loop (velocity + deceleration + threshold stop)
    const animate = () => {
      // Move the reel
      a.distance += a.speed;

      // Apply deceleration
      a.speed *= REEL_DECELERATION;

      const remaining = a.target - a.distance;

      // Update reel items
      setReelItems(
        a.items.map((item) => ({
          id: item.id,
          skin: item.skin,
          x: item.index * REEL_ITEM_TOTAL - a.distance,
        }))
      );

      // Stop condition: close enough AND speed slow enough
      if (Math.abs(remaining) > STOP_THRESHOLD || a.speed > MIN_SPEED) {
        requestAnimationFrame(animate);
      } else {
        // Final snap to exact target
        a.distance = a.target;

        setReelItems(
          a.items.map((item) => ({
            id: item.id,
            skin: item.skin,
            x: item.index * REEL_ITEM_TOTAL - a.distance,
          }))
        );

        setFinalSkin(a.winner);
        a.spinning = false;
      }
    };

    requestAnimationFrame(animate);
  };

  /* =======================
     RENDER
  ======================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading skins...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-8">
      <h1 className="text-5xl font-bold">CS2 Skin Slider</h1>

      {/* Reel container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-80 overflow-hidden border-4 border-gray-700 bg-gray-950"
      >
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-500 -translate-x-1/2 z-10" />

        {/* Reel */}
        <div className="absolute inset-0 flex items-center">
          {reelItems.map((item) => (
            <div
              key={item.id}
              style={{
                transform: `translateX(${item.x}px)`,
                width: REEL_ITEM_WIDTH,
              }}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <img
                src={item.skin.image}
                className="h-32 w-32 object-contain"
                alt={item.skin.name}
              />
              <p className="text-xs text-center px-2">{item.skin.name}</p>
            </div>
          ))}
        </div>

        {/* Result overlay */}
        {finalSkin && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <img
              src={finalSkin.image}
              className="h-56 w-56 object-contain"
              alt={finalSkin.name}
            />
            <p
              className="text-3xl font-bold mt-4"
              style={{ color: finalSkin.rarity.color }}
            >
              {finalSkin.name}
            </p>
            <p className="text-gray-400 mt-1">{finalSkin.rarity.name}</p>
          </div>
        )}
      </div>

      <button
        onClick={spin}
        disabled={anim.current.spinning}
        className="px-10 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-xl font-bold"
      >
        {anim.current.spinning ? 'Spinning…' : 'Spin'}
      </button>
    </div>
  );
}
