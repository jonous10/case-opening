'use client';

import { useState, useEffect } from 'react';

//interface Rarity {
//  id: string;
//  name: string;
//  color: string;
//}

class Skin {
  name: string;
  image: string;
  rarity: {
    id: string,
    name: string,
    color: string
  };
  weapon?: { name: string };

  constructor(
    name: string,
    image: string,
    rarity: {
      id: string,
      name: string,
      color: string
    },
    weapon?: { name: string }
  ) {
    this.name = name;
    this.image = image;
    this.rarity = rarity;
    this.weapon = weapon;
  }

  getDisplayName(): string {
    return this.weapon ? `${this.weapon.name} | ${this.name}` : this.name;
  }

  getRarityColor(): string {
    return this.rarity.color;
  }

  getBackgroundColor(): string {
    return this.rarity.color + '33'; // add transparency for bg
  }
}

export default function Home() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [openedSkin, setOpenedSkin] = useState<Skin | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkins = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'
        );
        const data = await response.json();

        // Convert JSON objects into Skin instances
        const skinObjects = data.map(
          (s: any) => new Skin(s.name, s.image, s.rarity, s.weapon)
        );

        setSkins(skinObjects);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch skins:', error);
        setLoading(false);
      }
    };

    fetchSkins();
  }, []);

  const openCase = () => {
    if (skins.length === 0) return;

    setIsOpening(true);
    const duration = 3000;

    let count = 0;
    const interval = setInterval(() => {
      const randomSkin = skins[Math.floor(Math.random() * skins.length)];
      setOpenedSkin(randomSkin);
      count++;

      if (count >= 15) {
        clearInterval(interval);
        // Final skin
        const finalSkin = skins[Math.floor(Math.random() * skins.length)];
        setOpenedSkin(finalSkin);
        setIsOpening(false);
      }
    }, duration / 15);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-black via-gray-900 to-black">
        <div className="text-white text-xl">Loading skins...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-black via-gray-900 to-black">
      <main className="flex flex-col items-center justify-center gap-8 py-12 px-4">
        <h1 className="text-5xl font-bold text-white text-center">CS2 Case Opening</h1>

        <div
          className="w-140 h-140 rounded-lg border-4 border-gray-700 flex items-center justify-center overflow-hidden relative shrink-0"
          style={openedSkin ? { backgroundColor: openedSkin.getBackgroundColor() } : {}}
        >
          {/* Skin Image */}
          {openedSkin?.image ? (
            <img
              src={openedSkin.image}
              alt={openedSkin.getDisplayName()}
              className="w-180 h-180 object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          ) : (
            <div className="text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              No image
            </div>
          )}

          {/* Skin Info */}
          {openedSkin && (
            <div className="absolute bottom-4 w-full text-center px-2">
              <p
                className="text-lg font-semibold truncate"
                style={{ color: openedSkin.getRarityColor() }}
              >
                {openedSkin.getDisplayName()}
              </p>
              <p className="text-sm text-gray-400">{openedSkin.rarity.name}</p>
            </div>
          )}

          {!openedSkin && (
            <div className="absolute bottom-4 w-full text-center text-gray-500 px-2">
              Click "Open Case" to reveal a random skin!
            </div>
          )}
        </div>


        <button
          onClick={openCase}
          disabled={isOpening || skins.length === 0}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold text-xl rounded-lg transition-colors duration-200 cursor-pointer"
        >
          {isOpening ? 'Opening...' : 'Open Case'}
        </button>

        <div className="text-gray-400 text-sm">Total skins available: {skins.length}</div>
      </main>
    </div>
  );
}
