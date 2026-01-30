/**
 * Inventory Hook
 * Manages the player's skin inventory with localStorage persistence
 */
import { useState, useEffect, useCallback } from 'react';
import { Skin } from '../types/Skin';

// Inventory item extends Skin with additional metadata
export interface InventoryItem extends Skin {
  id: string;
  acquiredAt: Date;
  source: 'case' | 'trade' | 'purchase';
}

const STORAGE_KEY = 'cs2_inventory';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load inventory from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        setInventory(parsed.map((item: any) => ({
          ...item,
          acquiredAt: new Date(item.acquiredAt)
        })));
      } catch {
        console.error('Failed to load inventory');
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever inventory changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    }
  }, [inventory, isLoading]);

  // Add a skin to inventory
  const addToInventory = useCallback((skin: Skin, source: InventoryItem['source'] = 'case') => {
    const newItem: InventoryItem = {
      ...skin,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      acquiredAt: new Date(),
      source
    };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  }, []);

  // Remove a skin by ID
  const removeFromInventory = useCallback((itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Get inventory statistics
  const getInventoryStats = useCallback(() => {
    return inventory.reduce(
      (acc, item) => {
        acc.total++;
        acc.byRarity[item.rarity.name] = (acc.byRarity[item.rarity.name] || 0) + 1;
        acc.byCategory[item.category?.name || 'Unknown'] = (acc.byCategory[item.category?.name || 'Unknown'] || 0) + 1;
        return acc;
      },
      { total: 0, byRarity: {} as Record<string, number>, byCategory: {} as Record<string, number> }
    );
  }, [inventory]);

  return {
    inventory,
    isLoading,
    addToInventory,
    removeFromInventory,
    getInventoryStats
  };
}
