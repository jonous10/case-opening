export interface Skin {
  name: string;
  image: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  weapon?: { name: string };
  category?: { id: string; name: string };
}
