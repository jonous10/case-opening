/**
 * Skin type definition
 * Represents a CS2 skin item with its properties
 */
export interface Skin {
  name: string;
  image: string;
  rarity: {
    id: string;
    name: string;
    color: string; // Hex color for UI styling
  };
  weapon?: { name: string };
  category?: { id: string; name: string };
}
