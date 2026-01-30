import { useState, useEffect } from 'react';
import { Skin } from '../types/Skin';

// Helper function to create skin objects
function createSkin(
  name: string,
  image: string,
  rarity: { id: string; name: string; color: string },
  weapon?: { name: string },
  category?: { id: string; name: string }
): Skin {
  return {
    name,
    image,
    rarity,
    weapon,
    category
  };
}

export function useSkins() {
  const [skins, setSkins] = useState<Skin[]>([]);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
    )
      .then((res) => res.json())
      .then((data) => {
        const skinObjects = data.map(
          (s: any) =>
            createSkin(s.name, s.image, s.rarity, s.weapon ? s.weapon : undefined, s.category)
        );

        // Deduplicate skins by name to avoid repetitive items
        const uniqueSkins = skinObjects.filter((skin: Skin, index: number, self: Skin[]) => 
          index === self.findIndex((s) => s.name === skin.name)
        );

        setSkins(uniqueSkins);
      })
      .catch((err) => console.error(err));
  }, []);

  return skins;
}
