import React, { useState, useEffect } from 'react';
import { Skin } from '../types/Skin';

interface TradeUpProps {
  inventory: any[];
  removeFromInventory: (itemId: string) => void;
  addToInventory: (skin: Skin, source: 'case' | 'trade' | 'purchase') => void;
  onClose: () => void;
}

export default function TradeUp({ inventory, removeFromInventory, addToInventory, onClose }: TradeUpProps) {
  const [selectedForTrade, setSelectedForTrade] = useState<string[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultSkin, setResultSkin] = useState<Skin | null>(null);
  const [sortBy, setSortBy] = useState<'rarity' | 'name' | 'category'>('rarity');

  // If this is being rendered as a modal, it should have its own visibility control
  // But since it's controlled from parent, we'll render the full interface
  
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
      default:
        return 0;
    }
  });

  // Get items by rarity for display
  const getItemsByRarity = (rarity: string) => {
    return sortedInventory.filter(item => item.rarity.name === rarity);
  };

  // Handle item selection for trade
  const toggleTradeSelection = (itemId: string) => {
    setSelectedForTrade(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Execute trade-up with animation
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
      
      // Get all knives and gloves from the full inventory for selection
      const allKnives = inventory.filter(item => item.category?.name === 'Knives');
      const allGloves = inventory.filter(item => item.category?.name === 'Gloves');
      const highTierItems = [...allKnives, ...allGloves];
      
      setTimeout(() => {
        let newSkin;
        
        if (highTierItems.length > 0) {
          // Randomly select from existing knives/gloves
          const randomItem = highTierItems[Math.floor(Math.random() * highTierItems.length)];
          newSkin = {
            name: `Trade-Up ${randomItem.category?.name || 'Item'}`,
            image: randomItem.image,
            rarity: {
              id: `rarity-${randomItem.rarity.name.toLowerCase()}`,
              name: randomItem.rarity.name,
              color: randomItem.rarity.color
            },
            category: randomItem.category
          };
        } else {
          // Fallback: create a knife/glove with the first item's image
          const isKnife = Math.random() > 0.5;
          newSkin = {
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
        }
        
        setResultSkin(newSkin);
        setShowResult(true);
        addToInventory(newSkin, 'trade');
        setSelectedForTrade([]);
        setIsTrading(false);
      }, 2000);
      return;
    }
    
    // Regular rarity progression for non-covert items
    const nextRarity = getNextRarity(currentRarity);
    
    if (!nextRarity) return;
    
    // Remove the 10 trade items
    selectedForTrade.forEach(itemId => {
      removeFromInventory(itemId);
    });
    
    // Simulate getting a new skin of higher rarity
    setTimeout(() => {
      const newSkin: Skin = {
        name: `Trade-Up ${nextRarity} ${firstItem.category?.name || 'Skin'}`,
        image: firstItem.image,
        rarity: {
          id: `rarity-${nextRarity.toLowerCase()}`,
          name: nextRarity,
          color: getNextRarityColor(nextRarity)
        },
        category: firstItem.category
      };
      
      setResultSkin(newSkin);
      setShowResult(true);
      addToInventory(newSkin, 'trade');
      setSelectedForTrade([]);
      setIsTrading(false);
    }, 2000);
  };

  // Get color for rarity
  const getNextRarityColor = (rarity: string): string => {
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

  // Check if selected items are all same rarity and exactly 10
  const canTrade = selectedForTrade.length === 10 && 
    selectedForTrade.every(id => {
      const item = inventory.find(i => i.id === id);
      const firstItem = inventory.find(i => i.id === selectedForTrade[0]);
      return item && firstItem && item.rarity.name === firstItem.rarity.name;
    });

  // Get rarity counts
  const rarityCounts = rarityOrder.reduce((acc, rarity) => {
    acc[rarity] = inventory.filter(item => item.rarity.name === rarity).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white">Trade-Up Contract</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Trade Mode Info */}
          <div className="mt-4 p-3 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-300">
              Select 10 skins of the same rarity to trade up for one skin of higher rarity.
              {selectedForTrade.length > 0 && (
                <span className="ml-2 text-amber-400">
                  {selectedForTrade.length === 10 && canTrade 
                    ? 'Ready to trade!' 
                    : `Need ${10 - selectedForTrade.length} more items of same rarity`}
                </span>
              )}
            </p>
            {selectedForTrade.length > 0 && (
              <div className="mt-2 text-xs text-amber-300">
                {(() => {
                  const firstItem = inventory.find(item => item.id === selectedForTrade[0]);
                  const rarity = firstItem?.rarity.name;
                  
                  if (rarity === 'Covert') {
                    return '🔥 Covert trades up to KNIFE or GLOVE! 🔥';
                  }
                  
                  const nextRarity = getNextRarity(rarity || '');
                  return nextRarity ? `→ ${nextRarity}` : 'Max rarity reached';
                })()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="text-slate-300">
              Selected: <span className={`font-bold ${canTrade ? 'text-green-400' : 'text-red-400'}`}>
                {selectedForTrade.length}/10
              </span>
            </div>
            <div className="text-slate-300">
              Total Items: <span className="text-white font-semibold">{inventory.length}</span>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 flex gap-2">
            <span className="text-slate-400 text-sm">Sort by:</span>
            {(['rarity', 'name', 'category'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                  sortBy === sort
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {inventory.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">No items available for trade-up</p>
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
                        style={{ backgroundColor: getNextRarityColor(rarity) }}
                      />
                      <h3 className="text-lg font-semibold text-white capitalize">{rarity}</h3>
                      <span className="text-slate-400 text-sm">({items.length} items)</span>
                      {items.length >= 10 && (
                        <span className="text-green-400 text-sm">✓ Can trade up</span>
                      )}
                      {rarity === 'Covert' && items.length >= 10 && (
                        <span className="text-amber-400 text-sm font-bold animate-pulse">🔥 KNIFE/GLOVE!</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                      {items.map((item) => {
                        const isSelected = selectedForTrade.includes(item.id);
                        const isDisabled = isTrading;
                        
                        return (
                          <div
                            key={item.id}
                            className={`relative group cursor-pointer transition-all duration-300 ${
                              isSelected ? 'scale-110 ring-2 ring-amber-400 rounded-lg' : ''
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                            onClick={() => !isDisabled && toggleTradeSelection(item.id)}
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
                                className="w-full h-full object-contain p-1"
                              />
                              
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                                  <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Item name */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {item.name}
                            </div>
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
        <div className="p-6 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              Select 10 items of the same rarity to trade up
            </div>
            
            <button
              onClick={executeTrade}
              disabled={!canTrade || isTrading}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all transform ${
                canTrade && !isTrading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isTrading ? 'Trading...' : 'Trade Up'}
            </button>
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
