import { useState, useEffect } from 'react';
import { Skin } from '../types/Skin';

interface InventoryItem extends Skin {
  id: string;
  acquiredAt: Date;
  source: 'case' | 'trade' | 'purchase';
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load inventory from localStorage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem('cs2_inventory');
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory);
        setInventory(parsed.map((item: any) => ({
          ...item,
          acquiredAt: new Date(item.acquiredAt)
        })));
      } catch (error) {
        console.error('Failed to load inventory:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cs2_inventory', JSON.stringify(inventory));
    }
  }, [inventory, isLoading]);

  const addToInventory = (skin: Skin, source: InventoryItem['source'] = 'case') => {
    const newItem: InventoryItem = {
      ...skin,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      acquiredAt: new Date(),
      source
    };
    
    setInventory(prev => [...prev, newItem]);
    return newItem;
  };

  const removeFromInventory = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  };

  const clearInventory = () => {
    setInventory([]);
    localStorage.removeItem('cs2_inventory');
  };

  const getInventoryStats = () => {
    const stats = inventory.reduce((acc, item) => {
      acc.total++;
      acc.byRarity[item.rarity.name] = (acc.byRarity[item.rarity.name] || 0) + 1;
      acc.byCategory[item.category?.name || 'Unknown'] = (acc.byCategory[item.category?.name || 'Unknown'] || 0) + 1;
      return acc;
    }, {
      total: 0,
      byRarity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    });

    return stats;
  };

  return {
    inventory,
    isLoading,
    addToInventory,
    removeFromInventory,
    clearInventory,
    getInventoryStats
  };
}
