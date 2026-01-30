/**
 * Inventory Component
 * Displays player's skin collection with trade-up functionality
 */
import React, { useState, useRef } from 'react';
import { Skin } from '../types/Skin';

// ============ Types ============

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
  getInventoryStats: () => { total: number; byRarity: Record<string, number>; byCategory: Record<string, number> };
  isLoading: boolean;
}

// ============ Constants ============

// Rarity order for sorting and trade-up progression
const RARITY_ORDER = ['Consumer', 'Industrial', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Extraordinary'];

// Rarity colors for UI
const RARITY_COLORS: Record<string, string> = {
  'Consumer': '#b0c3d9',
  'Industrial': '#5e98d9',
  'Mil-Spec': '#4b69ff',
  'Restricted': '#8847ff',
  'Classified': '#d32ce6',
  'Covert': '#eb4b4b',
  'Extraordinary': '#e4ae39'
};

// ============ Component ============

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
  // Sorting state
  const [sortBy, setSortBy] = useState<'rarity' | 'name' | 'category' | 'date'>('date');

  // Trade-up mode state
  const [tradeUpMode, setTradeUpMode] = useState(false);
  const [selectedForTrade, setSelectedForTrade] = useState<string[]>([]);
  const [initialTradeItem, setInitialTradeItem] = useState<string | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultSkin, setResultSkin] = useState<Skin | null>(null);

  // Drag-to-select state
  const [isDragging, setIsDragging] = useState(false);
  const holdTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const justEnteredTradeUp = useRef(false);

  const stats = getInventoryStats();

  // ============ Helper Functions ============

  const getNextRarity = (rarity: string): string | null => {
    const index = RARITY_ORDER.indexOf(rarity);
    return index < RARITY_ORDER.length - 1 ? RARITY_ORDER[index + 1] : null;
  };

  const getItemsByRarity = (rarity: string) => inventory.filter(item => item.rarity.name === rarity);

  // Sort inventory based on selected option
  const sortedInventory = [...inventory].sort((a, b) => {
    switch (sortBy) {
      case 'rarity': return RARITY_ORDER.indexOf(a.rarity.name) - RARITY_ORDER.indexOf(b.rarity.name);
      case 'name': return a.name.localeCompare(b.name);
      case 'category': return (a.category?.name || '').localeCompare(b.category?.name || '');
      case 'date': return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
      default: return 0;
    }
  });

  // ============ Trade-Up Handlers ============

  // Hold to enter trade-up mode
  const handleMouseDown = (itemId: string) => {
    holdTimers.current[itemId] = setTimeout(() => {
      setInitialTradeItem(itemId);
      setSelectedForTrade([itemId]);
      setTradeUpMode(true);
      justEnteredTradeUp.current = true;
      setIsDragging(true);
    }, 500);
  };

  // Clear timer on release
  const handleMouseUp = (itemId: string) => {
    if (holdTimers.current[itemId]) {
      clearTimeout(holdTimers.current[itemId]);
      delete holdTimers.current[itemId];
    }
  };

  // Clear timer when leaving item
  const handleMouseLeave = (itemId: string) => {
    if (holdTimers.current[itemId]) {
      clearTimeout(holdTimers.current[itemId]);
      delete holdTimers.current[itemId];
    }
  };

  // Stop dragging on global mouse up
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    Object.keys(holdTimers.current).forEach(id => {
      clearTimeout(holdTimers.current[id]);
      delete holdTimers.current[id];
    });
  };

  // Select items while dragging
  const handleMouseEnter = (itemId: string) => {
    if (!tradeUpMode || !isDragging || isTrading) return;

    const item = inventory.find(i => i.id === itemId);
    const initItem = inventory.find(i => i.id === initialTradeItem);

    if (item && initItem && item.rarity.name === initItem.rarity.name && !selectedForTrade.includes(itemId)) {
      setSelectedForTrade(prev => [...prev, itemId]);
    }
  };

  // Toggle selection on click
  const toggleSelection = (itemId: string) => {
    if (!tradeUpMode) return;
    if (justEnteredTradeUp.current) {
      justEnteredTradeUp.current = false;
      return;
    }

    const item = inventory.find(i => i.id === itemId);
    const initItem = inventory.find(i => i.id === initialTradeItem);

    if (item && initItem && item.rarity.name === initItem.rarity.name) {
      if (selectedForTrade.includes(itemId)) {
        if (selectedForTrade.length === 1) {
          cancelTradeUp(); // Exit if deselecting last item
        } else {
          setSelectedForTrade(prev => prev.filter(id => id !== itemId));
        }
      } else {
        setSelectedForTrade(prev => [...prev, itemId]);
      }
    }
  };

  // Exit trade-up mode
  const cancelTradeUp = () => {
    setTradeUpMode(false);
    setSelectedForTrade([]);
    setInitialTradeItem(null);
    setIsDragging(false);
  };

  // Execute the trade-up
  const executeTrade = () => {
    if (selectedForTrade.length !== 10) return;

    setIsTrading(true);
    const firstItem = inventory.find(item => item.id === selectedForTrade[0]);
    if (!firstItem) return;

    const currentRarity = firstItem.rarity.name;
    const nextRarity = currentRarity === 'Covert' ? 'Covert' : getNextRarity(currentRarity);
    const isSpecial = currentRarity === 'Covert';

    // Remove traded items
    selectedForTrade.forEach(id => removeFromInventory(id));

    // Create result after animation delay
    setTimeout(() => {
      const newSkin: Skin = isSpecial ? {
        name: `Trade-Up ${Math.random() > 0.5 ? 'Knife' : 'Gloves'}`,
        image: firstItem.image,
        rarity: { id: 'rarity-covert', name: 'Covert', color: '#eb4b4b' },
        category: { id: Math.random() > 0.5 ? 'knives' : 'gloves', name: Math.random() > 0.5 ? 'Knives' : 'Gloves' }
      } : {
        name: `Trade-Up ${nextRarity} ${firstItem.category?.name || 'Skin'}`,
        image: firstItem.image,
        rarity: { id: `rarity-${nextRarity?.toLowerCase()}`, name: nextRarity!, color: RARITY_COLORS[nextRarity!] },
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

  // ============ Computed Values ============

  const canTrade = selectedForTrade.length === 10;
  const initialItem = inventory.find(i => i.id === initialTradeItem);
  const targetRarity = initialItem
    ? (initialItem.rarity.name === 'Covert' ? 'KNIFE/GLOVE' : getNextRarity(initialItem.rarity.name))
    : null;

  if (!isOpen) return null;

  // ============ Render ============

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
                  <button onClick={cancelTradeUp} className="text-amber-400 hover:text-white">
                    <CloseIcon />
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <CloseIcon />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="text-slate-300">Total: <span className="text-white font-semibold">{stats.total}</span></div>
            <div className="text-slate-300">Knives: <span className="text-purple-400 font-semibold">{stats.byCategory['Knives'] || 0}</span></div>
            <div className="text-slate-300">Gloves: <span className="text-yellow-400 font-semibold">{stats.byCategory['Gloves'] || 0}</span></div>
            {tradeUpMode && (
              <div className="text-slate-300">
                Selected: <span className={`font-bold ${canTrade ? 'text-green-400' : 'text-red-400'}`}>{selectedForTrade.length}/10</span>
              </div>
            )}
          </div>

          {/* Trade-up info */}
          {tradeUpMode && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">🎯 Drag to select skins of the same rarity</p>
              {targetRarity && <p className="text-xs text-amber-400 mt-1">→ {targetRarity === 'KNIFE/GLOVE' ? '🔥 KNIFE OR GLOVE!' : targetRarity}</p>}
            </div>
          )}

          {/* Help text */}
          {!tradeUpMode && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400">💡 Click and hold any skin to enter trade-up mode</p>
            </div>
          )}

          {/* Sort options */}
          <div className="mt-4 flex gap-2">
            <span className="text-slate-400 text-sm">Sort:</span>
            {(['date', 'rarity', 'name', 'category'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded text-sm capitalize ${sortBy === sort ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {isLoading ? (
            <div className="text-center text-slate-400">Loading...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">Your inventory is empty</p>
              <p className="text-sm mt-2">Open some cases to get started!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {RARITY_ORDER.map(rarity => {
                const items = getItemsByRarity(rarity);
                if (items.length === 0) return null;

                return (
                  <div key={rarity} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: RARITY_COLORS[rarity] }} />
                      <h3 className="text-lg font-semibold text-white">{rarity}</h3>
                      <span className="text-slate-400 text-sm">({items.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {items.map(item => (
                        <SkinCard
                          key={item.id}
                          item={item}
                          isSelected={selectedForTrade.includes(item.id)}
                          isInitial={item.id === initialTradeItem}
                          selectionIndex={selectedForTrade.indexOf(item.id) + 1}
                          tradeUpMode={tradeUpMode}
                          isTrading={isTrading}
                          isSameRarity={initialItem ? item.rarity.name === initialItem.rarity.name : false}
                          onMouseDown={() => handleMouseDown(item.id)}
                          onMouseUp={() => handleMouseUp(item.id)}
                          onMouseLeave={() => handleMouseLeave(item.id)}
                          onMouseEnter={() => handleMouseEnter(item.id)}
                          onClick={() => tradeUpMode ? toggleSelection(item.id) : onSkinSelect?.(item)}
                          onDelete={() => {
                            if (confirm(`Remove ${item.name}?`)) removeFromInventory(item.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="text-xs text-slate-400">Saved locally</div>
          <div className="flex gap-3">
            {tradeUpMode && (
              <button
                onClick={executeTrade}
                disabled={!canTrade || isTrading}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${canTrade && !isTrading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
              >
                {isTrading ? 'Trading...' : `Trade Up (${selectedForTrade.length}/10)`}
              </button>
            )}
            <button
              onClick={() => { if (confirm('Clear entire inventory?')) { localStorage.removeItem('cs2_inventory'); window.location.reload(); } }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear Inventory
            </button>
          </div>
        </div>
      </div>

      {/* Trade Result Modal */}
      {showResult && resultSkin && (
        <div className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse">
              <div className="w-64 h-64 rounded-full blur-3xl opacity-50" style={{ backgroundColor: resultSkin.rarity.color }} />
            </div>
            <div className="relative bg-slate-900 rounded-2xl border-2 p-8 text-center" style={{ borderColor: resultSkin.rarity.color }}>
              <h3 className="text-2xl font-bold text-white mb-2">Trade-Up Successful!</h3>
              <div className="text-lg font-semibold mb-6" style={{ color: resultSkin.rarity.color }}>{resultSkin.rarity.name}</div>
              <div className="w-48 h-48 mx-auto mb-6">
                <img src={resultSkin.image} alt={resultSkin.name} className="w-full h-full object-contain" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">{resultSkin.name}</h4>
              <button
                onClick={() => { setShowResult(false); setResultSkin(null); }}
                className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400"
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

// ============ Sub-Components ============

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface SkinCardProps {
  item: InventoryItem;
  isSelected: boolean;
  isInitial: boolean;
  selectionIndex: number;
  tradeUpMode: boolean;
  isTrading: boolean;
  isSameRarity: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onMouseEnter: () => void;
  onClick: () => void;
  onDelete: () => void;
}

function SkinCard({
  item, isSelected, isInitial, selectionIndex, tradeUpMode, isTrading, isSameRarity,
  onMouseDown, onMouseUp, onMouseLeave, onMouseEnter, onClick, onDelete
}: SkinCardProps) {
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 select-none
        ${isSelected ? 'scale-110 ring-2 ring-amber-400 rounded-lg' : ''}
        ${isInitial ? 'ring-2 ring-green-400 rounded-lg' : ''}
        ${isTrading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${tradeUpMode && !isSameRarity && !isSelected ? 'opacity-30' : ''}`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div
        className="aspect-square rounded-lg overflow-hidden border-2"
        style={{
          background: `linear-gradient(135deg, ${item.rarity.color}20, ${item.rarity.color}05)`,
          borderColor: item.rarity.color
        }}
      >
        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2 pointer-events-none" draggable={false} />

        {/* Selection indicator */}
        {tradeUpMode && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center">
            {isInitial ? (
              <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-slate-900 font-bold">1</span>
              </div>
            ) : isSelected ? (
              <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-slate-900 font-bold">{selectionIndex}</span>
              </div>
            ) : (
              <div className="w-4 h-4 bg-slate-800/80" />
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

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
        {item.name}
        {tradeUpMode && !isSameRarity && !isSelected && <div className="text-red-400">Different rarity</div>}
      </div>

      {/* Delete button */}
      {!tradeUpMode && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

interface InventoryItem extends Skin {
  id: string;
  acquiredAt: Date;
  source: 'case' | 'trade' | 'purchase';
}
