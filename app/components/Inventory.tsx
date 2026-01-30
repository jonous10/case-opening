import React, { useState, useRef } from 'react';
import { Skin } from '../types/Skin';

interface InventoryItem extends Skin {
  id: string;
  acquiredAt: Date;
  source: 'case' | 'trade' | 'purchase';
}

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSkinSelect?: (skin: Skin) => void;
  inventory: InventoryItem[];
  removeFromInventory: (itemId: string) => void;
  addToInventory: (skin: Skin, source: 'case' | 'trade' | 'purchase') => void;
  getInventoryStats: () => {
    total: number;
    byRarity: Record<string, number>;
    byCategory: Record<string, number>;
  };
  isLoading: boolean;
}

export default function Inventory({
  isOpen,
  onClose,
  onSkinSelect,
  inventory,
  removeFromInventory,
  addToInventory,
  getInventoryStats,
  isLoading
}: InventoryProps) {
  const [sortBy, setSortBy] = useState<'rarity' | 'name' | 'category' | 'date'>('date');
  const [tradeUpMode, setTradeUpMode] = useState(false);
  const [selectedForTrade, setSelectedForTrade] = useState<string[]>([]);
  const [initialTradeItem, setInitialTradeItem] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultSkin, setResultSkin] = useState<Skin | null>(null);

  // For click and hold detection
  const holdTimers = useRef<Record<string, NodeJS.Timeout>>({});
  // To prevent the initial click from deselecting
  const justEnteredTradeUp = useRef(false);
  // For drag-to-select
  const [isDragging, setIsDragging] = useState(false);

  const stats = getInventoryStats();

  // Get rarity order for trade-up logic
  const rarityOrder = ['Consumer', 'Industrial', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Extraordinary'];

  // Get next rarity level
  const getNextRarity = (currentRarity: string): string | null => {
    const currentIndex = rarityOrder.indexOf(currentRarity);
    return currentIndex < rarityOrder.length - 1 ? rarityOrder[currentIndex + 1] : null;
  };

  // Sort inventory
  const sortedInventory = [...inventory].sort((a, b) => {
    switch (sortBy) {
      case 'rarity':
        return rarityOrder.indexOf(a.rarity.name) - rarityOrder.indexOf(b.rarity.name);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return (a.category?.name || '').localeCompare(b.category?.name || '');
      case 'date':
        return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
      default:
        return 0;
    }
  });

  // Get items by rarity for display
  const getItemsByRarity = (rarity: string) => {
    return sortedInventory.filter(item => item.rarity.name === rarity);
  };

  // Get color for rarity
  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      'Consumer': '#b0c3d9',
      'Industrial': '#5e98d9',
      'Mil-Spec': '#4b69ff',
      'Restricted': '#8847ff',
      'Classified': '#d32ce6',
      'Covert': '#eb4b4b',
      'Extraordinary': '#e4ae39'
    };
    return colors[rarity] || '#ffffff';
  };

  // Handle mouse down - start timer for trade-up mode
  const handleMouseDown = (itemId: string) => {
    holdTimers.current[itemId] = setTimeout(() => {
      // Enter trade-up mode with this item as the first selection
      setInitialTradeItem(itemId);
      setSelectedForTrade([itemId]);
      setTradeUpMode(true);
      justEnteredTradeUp.current = true;
      setIsDragging(true);
    }, 500); // 500ms hold
  };

  // Handle mouse up - clear timer (dragging stops via global handler)
  const handleMouseUp = (itemId: string) => {
    if (holdTimers.current[itemId]) {
      clearTimeout(holdTimers.current[itemId]);
      delete holdTimers.current[itemId];
    }
  };

  // Handle mouse leave - only clear timer (don't stop dragging)
  const handleItemMouseLeave = (itemId: string) => {
    if (holdTimers.current[itemId]) {
      clearTimeout(holdTimers.current[itemId]);
      delete holdTimers.current[itemId];
    }
  };

  // Handle global mouse up to stop dragging
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    // Also clear any pending timers
    Object.keys(holdTimers.current).forEach(id => {
      clearTimeout(holdTimers.current[id]);
      delete holdTimers.current[id];
    });
  };

  // Cancel trade-up mode
  const cancelTradeUp = () => {
    setTradeUpMode(false);
    setSelectedForTrade([]);
    setInitialTradeItem(null);
    setIsDragging(false);
  };

  // Handle mouse enter for drag-to-select
  const handleMouseEnter = (itemId: string) => {
    if (!tradeUpMode || !isDragging || isTrading) return;

    const item = inventory.find(i => i.id === itemId);
    const initItem = inventory.find(i => i.id === initialTradeItem);

    // Can only select items of same rarity as initial item
    if (item && initItem && item.rarity.name === initItem.rarity.name) {
      // Only add if not already selected
      if (!selectedForTrade.includes(itemId)) {
        setSelectedForTrade(prev => [...prev, itemId]);
      }
    }
  };

  // Handle item selection in trade-up mode
  const toggleTradeSelection = (itemId: string) => {
    if (!tradeUpMode) return;

    // Skip the click that triggered trade-up mode
    if (justEnteredTradeUp.current) {
      justEnteredTradeUp.current = false;
      return;
    }

    const item = inventory.find(i => i.id === itemId);
    const initialItem = inventory.find(i => i.id === initialTradeItem);

    // Can only select items of same rarity as initial item
    if (item && initialItem && item.rarity.name === initialItem.rarity.name) {
      if (selectedForTrade.includes(itemId)) {
        // Deselecting - check if it's the last one
        if (selectedForTrade.length === 1) {
          // Last item - exit trade up mode
          cancelTradeUp();
        } else {
          setSelectedForTrade(prev => prev.filter(id => id !== itemId));
        }
      } else {
        // Selecting
        setSelectedForTrade(prev => [...prev, itemId]);
      }
    }
  };

  // Execute trade-up
  const executeTrade = async () => {
    if (selectedForTrade.length !== 10) return;

    setIsTrading(true);

    // Get the first selected item to determine rarity
    const firstItem = inventory.find(item => item.id === selectedForTrade[0]);
    if (!firstItem) return;

    const currentRarity = firstItem.rarity.name;

    // Covert trades up to knife or glove!
    if (currentRarity === 'Covert') {
      // Remove the 10 trade items
      selectedForTrade.forEach(itemId => {
        removeFromInventory(itemId);
      });

      setTimeout(() => {
        // Create knife or glove
        const isKnife = Math.random() > 0.5;
        const newSkin: Skin = {
          name: `Trade-Up ${isKnife ? 'Knife' : 'Gloves'}`,
          image: firstItem.image,
          rarity: {
            id: 'rarity-covert',
            name: 'Covert',
            color: '#eb4b4b'
          },
          category: {
            id: isKnife ? 'knives' : 'gloves',
            name: isKnife ? 'Knives' : 'Gloves'
          }
        };

        setResultSkin(newSkin);
        setShowResult(true);
        addToInventory(newSkin, 'trade');
        setSelectedForTrade([]);
        setInitialTradeItem(null);
        setTradeUpMode(false);
        setIsTrading(false);
      }, 2000);
      return;
    }

    // Regular rarity progression
    const nextRarity = getNextRarity(currentRarity);

    if (!nextRarity) return;

    // Remove the 10 trade items
    selectedForTrade.forEach(itemId => {
      removeFromInventory(itemId);
    });

    setTimeout(() => {
      const newSkin: Skin = {
        name: `Trade-Up ${nextRarity} ${firstItem.category?.name || 'Skin'}`,
        image: firstItem.image,
        rarity: {
          id: `rarity-${nextRarity.toLowerCase()}`,
          name: nextRarity,
          color: getRarityColor(nextRarity)
        },
        category: firstItem.category
      };

      setResultSkin(newSkin);
      setShowResult(true);
      addToInventory(newSkin, 'trade');
      setSelectedForTrade([]);
      setInitialTradeItem(null);
      setTradeUpMode(false);
      setIsTrading(false);
    }, 2000);
  };



  // Check if can trade
  const canTrade = selectedForTrade.length === 10;
  const initialItem = inventory.find(i => i.id === initialTradeItem);
  const targetRarity = initialItem ? (initialItem.rarity.name === 'Covert' ? 'KNIFE/GLOVE' : getNextRarity(initialItem.rarity.name)) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseUp={handleGlobalMouseUp}>
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">My Inventory</h2>
              {tradeUpMode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500 rounded-lg">
                  <span className="text-amber-400 font-semibold">Trade-Up Mode</span>
                  <button
                    onClick={cancelTradeUp}
                    className="text-amber-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="text-slate-300">
              Total Items: <span className="text-white font-semibold">{stats.total}</span>
            </div>
            <div className="text-slate-300">
              Knives: <span className="text-purple-400 font-semibold">{stats.byCategory['Knives'] || 0}</span>
            </div>
            <div className="text-slate-300">
              Gloves: <span className="text-yellow-400 font-semibold">{stats.byCategory['Gloves'] || 0}</span>
            </div>
            {tradeUpMode && (
              <div className="text-slate-300">
                Selected: <span className={`font-bold ${canTrade ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedForTrade.length}/10
                </span>
              </div>
            )}
          </div>

          {/* Trade-Up Mode Info */}
          {tradeUpMode && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                🎯 Click and hold to enter trade-up mode • Select 9 more {initialItem?.rarity.name} skins
              </p>
              {targetRarity && (
                <p className="text-xs text-amber-400 mt-1">
                  → {targetRarity === 'KNIFE/GLOVE' ? '🔥 KNIFE OR GLOVE! 🔥' : targetRarity}
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          {!tradeUpMode && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400">
                💡 Click and hold any skin to enter trade-up mode
              </p>
            </div>
          )}

          {/* Sort Options */}
          <div className="mt-4 flex gap-2">
            <span className="text-slate-400 text-sm">Sort by:</span>
            {(['date', 'rarity', 'name', 'category'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded text-sm capitalize transition-colors ${sortBy === sort
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {isLoading ? (
            <div className="text-center text-slate-400">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">Your inventory is empty</p>
              <p className="text-sm mt-2">Open some cases to get started!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rarity Sections */}
              {rarityOrder.map(rarity => {
                const items = getItemsByRarity(rarity);
                if (items.length === 0) return null;

                return (
                  <div key={rarity} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getRarityColor(rarity) }}
                      />
                      <h3 className="text-lg font-semibold text-white capitalize">{rarity}</h3>
                      <span className="text-slate-400 text-sm">({items.length} items)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {items.map((item) => {
                        const isSelected = selectedForTrade.includes(item.id);
                        const isInitialItem = item.id === initialTradeItem;
                        const canSelect = tradeUpMode && !isTrading;
                        const isDisabled = isTrading;
                        const isSameRarity = initialItem ? item.rarity.name === initialItem.rarity.name : false;

                        return (
                          <div
                            key={item.id}
                            className={`relative group cursor-pointer transition-all duration-300 select-none ${isSelected ? 'scale-110 ring-2 ring-amber-400 rounded-lg' : ''
                              } ${isInitialItem ? 'ring-2 ring-green-400 rounded-lg' : ''}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                            ${tradeUpMode && !isSameRarity && !isSelected ? 'opacity-30' : ''}`}
                            onMouseDown={() => handleMouseDown(item.id)}
                            onMouseUp={() => handleMouseUp(item.id)}
                            onMouseLeave={() => handleItemMouseLeave(item.id)}
                            onMouseEnter={() => handleMouseEnter(item.id)}
                            onClick={() => {
                              if (canSelect) {
                                toggleTradeSelection(item.id);
                              } else if (!tradeUpMode) {
                                onSkinSelect?.(item);
                              }
                            }}
                          >
                            <div
                              className="aspect-square rounded-lg overflow-hidden border-2"
                              style={{
                                background: `linear-gradient(135deg, ${item.rarity.color}20, ${item.rarity.color}05)`,
                                borderColor: item.rarity.color
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-contain p-2 pointer-events-none"
                                draggable={false}
                              />

                              {/* Trade selection indicators */}
                              {tradeUpMode && (
                                <div className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center">
                                  {isInitialItem ? (
                                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-slate-900 font-bold">1</span>
                                    </div>
                                  ) : isSelected ? (
                                    <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-slate-900 font-bold">
                                        {selectedForTrade.indexOf(item.id) + 1}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 bg-slate-800/80 border-slate-400" />
                                  )}
                                </div>
                              )}

                              {/* Hold indicator */}
                              {!tradeUpMode && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Item name tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {item.name}
                              {tradeUpMode && !isSameRarity && !isSelected && (
                                <div className="text-red-400 text-xs">Different rarity</div>
                              )}
                            </div>

                            {/* Delete button (only when not in trade mode) */}
                            {!tradeUpMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Remove ${item.name} from inventory?`)) {
                                    removeFromInventory(item.id);
                                  }
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-400">
              Inventory saved locally
            </div>

            <div className="flex gap-3">
              {tradeUpMode && (
                <button
                  onClick={executeTrade}
                  disabled={!canTrade || isTrading}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all transform ${canTrade && !isTrading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {isTrading ? 'Trading...' : `Trade Up (${selectedForTrade.length}/10)`}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Clear entire inventory? This cannot be undone.')) {
                    localStorage.removeItem('cs2_inventory');
                    window.location.reload();
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear Inventory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Animation Modal */}
      {showResult && resultSkin && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="relative">
            {/* Animated background */}
            <div className="absolute inset-0 animate-pulse">
              <div
                className="w-64 h-64 rounded-full blur-3xl opacity-50"
                style={{ backgroundColor: resultSkin.rarity.color }}
              />
            </div>

            {/* Result content */}
            <div className="relative bg-slate-900 rounded-2xl border-2 p-8 text-center"
              style={{ borderColor: resultSkin.rarity.color }}>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Trade-Up Successful!</h3>
                <div
                  className="text-lg font-semibold"
                  style={{ color: resultSkin.rarity.color }}
                >
                  {resultSkin.rarity.name}
                </div>
              </div>

              <div className="w-48 h-48 mx-auto mb-6">
                <img
                  src={resultSkin.image}
                  alt={resultSkin.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <h4 className="text-xl font-bold text-white mb-4">{resultSkin.name}</h4>

              <button
                onClick={() => {
                  setShowResult(false);
                  setResultSkin(null);
                }}
                className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
