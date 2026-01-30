import { Skin } from '../types/Skin';

// CS-style roll configuration
const TOTAL_ROLLS = 100000;
const RARITY_ROLL_COUNTS = {
  gloves: 130,      // 0.13%
  knife: 260,       // 0.26%
  red: 3200,        // 3.20%
  pink: 15980,      // 15.98%
  purple: 20000,    // 20.00%
  blue: 60560       // 60.56%
};

// CS-style odds per 1-100000
function rarityFromRoll(roll: number): string {
  if (roll <= 130) return "gloves";      // 0.13%
  if (roll <= 390) return "knife";       // 0.26% (130+260)
  if (roll <= 3590) return "red";        // 3.20% (390+3200)
  if (roll <= 19570) return "pink";      // 15.98% (3590+15980)
  if (roll <= 39570) return "purple";    // 20.00% (19570+20000)
  return "blue";                         // 60.56% (39570+60560)
}

// Map CS-style rarity names to actual skin rarity names
function mapRarityToSkinRarity(csRarity: string): string {
  const rarityMap: Record<string, string> = {
    "gloves": "Extraordinary",
    "knife": "Extraordinary",
    "red": "Covert", 
    "pink": "Classified",
    "purple": "Restricted",
    "blue": "Mil-Spec Grade"
  };
  return rarityMap[csRarity] || "Mil-Spec Grade";
}

export function calculateRarityWeights(skins: Skin[]): Record<string, number> {
  // Count skins by rarity
  const rarityCounts: Record<string, number> = {};
  skins.forEach(skin => {
    const rarity = skin.rarity.name;
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
  });

  // Calculate weights based on skin count for each rarity
  const weights: Record<string, number> = {};
  Object.entries(rarityCounts).forEach(([rarity, count]) => {
    // Weight is simply the count of skins in this rarity
    weights[rarity] = count;
  });

  return weights;
}

export function getRandomSkin(skins: Skin[]): Skin {
  const rarityWeights = calculateRarityWeights(skins);
  
  const knives = skins.filter(s => s.category?.name === "Knives");
  const gloves = skins.filter(s => s.category?.name === "Gloves");
  const regularSkins = skins.filter(s => 
    s.category?.name !== "Knives" && 
    s.category?.name !== "Gloves"
  );

  // Use the integrated CS-style roll system
  const roll = Math.floor(Math.random() * TOTAL_ROLLS) + 1; // 1-100000
  
  // Determine rarity based on CS-style roll
  const csRarity = rarityFromRoll(roll);
  
  // Handle special categories directly
  if (csRarity === "gloves" && gloves.length > 0) {
    return gloves[Math.floor(Math.random() * gloves.length)];
  }
  
  if (csRarity === "knife" && knives.length > 0) {
    return knives[Math.floor(Math.random() * knives.length)];
  }
  
  // For regular skins, map the rarity and filter
  const selectedRarity = mapRarityToSkinRarity(csRarity);
  const raritySkins = regularSkins.filter(skin => skin.rarity.name === selectedRarity);
  
  // If no skins of this rarity, fallback to Mil-Spec
  if (raritySkins.length === 0) {
    const fallbackSkins = regularSkins.filter(skin => skin.rarity.name === "Mil-Spec Grade");
    return fallbackSkins[Math.floor(Math.random() * fallbackSkins.length)] || regularSkins[0];
  }
  
  // Return random skin from selected rarity
  return raritySkins[Math.floor(Math.random() * raritySkins.length)];
}

// Optional: Format odds function for display
export function formatOdds(rarityKey: string, poolSize: number): string {
  const rollCount = RARITY_ROLL_COUNTS[rarityKey as keyof typeof RARITY_ROLL_COUNTS];
  if (!rollCount || !Number.isFinite(poolSize) || poolSize <= 0) {
    return "Odds: -";
  }

  const oddsPerSkin = rollCount / poolSize;
  const oddsPercent = (oddsPerSkin / TOTAL_ROLLS) * 100;
  const percentText = oddsPercent >= 1
    ? oddsPercent.toFixed(2)
    : oddsPercent >= 0.1
      ? oddsPercent.toFixed(3)
      : oddsPercent.toFixed(4);
  const oneIn = Math.max(1, Math.round(TOTAL_ROLLS / oddsPerSkin));

  return `Odds: 1 in ${oneIn.toLocaleString("en-US")} (${percentText}%)`;
}
