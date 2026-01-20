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
  const [skins, setSkins] = useState<Skin[]>([]);
  const [reelSkins, setReelSkins] = useState<Skin[]>([]);
  const [rolling, setRolling] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  const rarityWeights: Record<string, number> = {
    "Consumer": 79,
    "Industrial": 15,
    "Mil-Spec": 4,
    "Restricted": 1,
    "Classified": 0.25,
    "Covert": .1, // Knifes
    "Extraordinary": 0.001, // Gloves
  };

  function getRandomSkin(skins: Skin[]): Skin {
    const totalWeight = skins.reduce(
      (sum, skin) => sum + (rarityWeights[skin.rarity.name] || 1),
      0
    );

    let random = Math.random() * totalWeight;

    for (const skin of skins) {
      random -= rarityWeights[skin.rarity.name] || 1;
      if (random <= 0) return skin;
    }

    return skins[skins.length - 1];
  }


  // Fetch skins
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
    )
      .then((res) => res.json())
      .then((data) => {
        // Convert plain objects to Skin instances
        const skinObjects = data.map(
          (s: any) =>
            new Skin(s.name, s.image, s.rarity, s.weapon ? s.weapon : undefined)
        );
        setSkins(skinObjects);
      })
      .catch((err) => console.error(err));
  }, []);

  const startRoll = () => {
    if (rolling || skins.length === 0) return;

    setRolling(true);
    setSelectedSkin(null);

    // Pick the winner
    const winner = getRandomSkin(skins);
    setSelectedSkin(winner);

    // Build the reel
    const reelLength = 30;
    const reelArray: Skin[] = [];

    // Filter out knives for reel items
    const nonKnifeSkins = skins.filter(s => s.category?.name !== "Knives");

    for (let i = 0; i < reelLength; i++) {
      const skin = getRandomSkin(nonKnifeSkins);

      reelArray.push(skin);
    }

    // Insert the winner so it aligns with the center indicator
    const centerIndex = 10;
    reelArray[centerIndex] = winner;
    setReelSkins(reelArray);

    // Reset position
    if (reelRef.current) {
      reelRef.current.style.transition = "none";
      reelRef.current.style.transform = "translateY(0)";
    }

    // Animate reel
    setTimeout(() => {
      if (reelRef.current) {
        reelRef.current.style.transition =
          "transform 3s cubic-bezier(0.25, 1, 0.5, 1)";
        reelRef.current.style.transform = `translateY(-${centerIndex * 82}px)`;
      }
    }, 50);

    // End animation
    setTimeout(() => {
      setRolling(false);
    }, 3050);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">CS2 Case Opener</h1>
      <div className="relative w-48 h-64 overflow-hidden border-4 border-gray-700 rounded-lg mb-6">
        <div ref={reelRef} className="flex flex-col items-center justify-start">
          {reelSkins.map((skin, index) => (
            <div
              key={index}
              className="w-full h-20 flex items-center justify-center mb-2 p-2 rounded"
              style={{ border: `2px solid ${skin.rarity.color}`,
                        background: `${skin.rarity.color}` + 28}}
            >
              <img
                src={skin.image}
                alt={skin.name}
                className="h-16 object-contain mr-2"
              />
              <span className="text-sm">{skin.name}</span>
            </div>
          ))}
        </div>
        {/* Center indicator */}
        <div className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 border-2 border-yellow-400 pointer-events-none"></div>
      </div>
      <button
        onClick={startRoll}
        disabled={rolling}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded"
      >
        {rolling ? "Rolling..." : "Open Case"}
      </button>

      {selectedSkin && !rolling && (
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold">You won:</h2>
          <div
            className="inline-flex items-center mt-2 p-4 border-4 rounded"
            style={{ borderColor: selectedSkin.rarity.color }}
          >
            <img
              src={selectedSkin.image}
              alt={selectedSkin.name}
              className="h-24 object-contain mr-4"
            />
            <div className="text-left">
              <div className="font-bold">{selectedSkin.name}</div>
              {selectedSkin.weapon && (
                <div className="text-sm">{selectedSkin.weapon.name}</div>
              )}
              <div
                className="font-semibold"
                style={{ color: selectedSkin.rarity.color }}
              >
                {selectedSkin.rarity.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
