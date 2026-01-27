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
  getInventoryStats: () => {
    total: number;
    byRarity: Record<string, number>;
    byCategory: Record<string, number>;
  };
  isLoading: boolean;
}

export default function Inventory({ isOpen, onClose, onSkinSelect, inventory, removeFromInventory, getInventoryStats, isLoading }: InventoryProps) {
  const stats = getInventoryStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">My Inventory</h2>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-pointer"
                  onClick={() => onSkinSelect?.(item)}
                >
                  <div
                    className="aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${item.rarity.color}20, ${item.rarity.color}05)`,
                      borderColor: item.rarity.color
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  
                  {/* Item name tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {item.name}
                  </div>

                  {/* Delete button */}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-400">
              Inventory saved locally
            </div>
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
  );
}
