/**
 * Skins Hook
 * Fetches all CS2 skins from the API and deduplicates them
 */
import { useState, useEffect } from 'react';
import { Skin } from '../types/Skin';

const SKINS_API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';

export function useSkins() {
  const [skins, setSkins] = useState<Skin[]>([]);

  useEffect(() => {
    fetch(SKINS_API_URL)
      .then(res => res.json())
      .then(data => {
        // Map API response to our Skin type
        const skinObjects: Skin[] = data.map((s: any) => ({
          name: s.name,
          image: s.image,
          rarity: s.rarity,
          weapon: s.weapon,
          category: s.category
        }));

        // Remove duplicates by name
        const uniqueSkins = skinObjects.filter(
          (skin, index, self) => index === self.findIndex(s => s.name === skin.name)
        );

        setSkins(uniqueSkins);
      })
      .catch(err => console.error('Failed to fetch skins:', err));
  }, []);

  return skins;
}
