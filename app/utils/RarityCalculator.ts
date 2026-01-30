/**
 * Rarity Calculator
 * Handles CS2-style weighted random skin selection
 */
import { Skin } from '../types/Skin';

// Total "tickets" for the lottery system
const TOTAL_ROLLS = 100000;

// How many "tickets" each rarity gets (determines drop rates)
const RARITY_TICKETS = {
  gloves: 130,    // 0.13%
  knife: 260,     // 0.26%
  red: 3200,      // 3.20%  (Covert)
  pink: 15980,    // 15.98% (Classified)
  purple: 20000,  // 20.00% (Restricted)
  blue: 60560     // 60.56% (Mil-Spec)
};

// Map roll number to CS rarity tier
function getRarityFromRoll(roll: number): string {
  if (roll <= 130) return 'gloves';
  if (roll <= 390) return 'knife';
  if (roll <= 3590) return 'red';
  if (roll <= 19570) return 'pink';
  if (roll <= 39570) return 'purple';
  return 'blue';
}

// Map CS tier names to actual skin rarity names from API
const RARITY_MAP: Record<string, string> = {
  gloves: 'Extraordinary',
  knife: 'Extraordinary',
  red: 'Covert',
  pink: 'Classified',
  purple: 'Restricted',
  blue: 'Mil-Spec Grade'
};

/**
 * Get a random skin using CS2-style odds
 */
export function getRandomSkin(skins: Skin[]): Skin {
  // Separate special items from regular skins
  const knives = skins.filter(s => s.category?.name === 'Knives');
  const gloves = skins.filter(s => s.category?.name === 'Gloves');
  const regularSkins = skins.filter(s =>
    s.category?.name !== 'Knives' && s.category?.name !== 'Gloves'
  );

  // Roll the dice (1 to 100000)
  const roll = Math.floor(Math.random() * TOTAL_ROLLS) + 1;
  const tier = getRarityFromRoll(roll);

  // Handle special categories
  if (tier === 'gloves' && gloves.length > 0) {
    return gloves[Math.floor(Math.random() * gloves.length)];
  }
  if (tier === 'knife' && knives.length > 0) {
    return knives[Math.floor(Math.random() * knives.length)];
  }

  // Get skins of the rolled rarity
  const targetRarity = RARITY_MAP[tier];
  const matchingSkins = regularSkins.filter(s => s.rarity.name === targetRarity);

  // Fallback to Mil-Spec if no matching skins
  if (matchingSkins.length === 0) {
    const fallback = regularSkins.filter(s => s.rarity.name === 'Mil-Spec Grade');
    return fallback[Math.floor(Math.random() * fallback.length)] || regularSkins[0];
  }

  return matchingSkins[Math.floor(Math.random() * matchingSkins.length)];
}

/**
 * Format odds string for display (optional utility)
 */
export function formatOdds(rarityKey: keyof typeof RARITY_TICKETS, poolSize: number): string {
  const tickets = RARITY_TICKETS[rarityKey];
  if (!tickets || poolSize <= 0) return 'Odds: -';

  const oddsPerSkin = tickets / poolSize;
  const percent = (oddsPerSkin / TOTAL_ROLLS) * 100;
  const oneIn = Math.max(1, Math.round(TOTAL_ROLLS / oddsPerSkin));

  const percentText = percent >= 1 ? percent.toFixed(2)
    : percent >= 0.1 ? percent.toFixed(3)
      : percent.toFixed(4);

  return `Odds: 1 in ${oneIn.toLocaleString()} (${percentText}%)`;
}
