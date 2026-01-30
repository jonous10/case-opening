/**
 * OpenButton Component
 * Main button to open cases + auto-roll toggle
 */

interface OpenButtonProps {
  rolling: boolean;
  onStartRoll: () => void;
  autoRoll: boolean;
  onToggleAutoRoll: () => void;
}

export default function OpenButton({ rolling, onStartRoll, autoRoll, onToggleAutoRoll }: OpenButtonProps) {
  return (
    <div className="relative z-20 mt-8 flex justify-center gap-4">
      {/* Main Open Button */}
      <button
        onClick={onStartRoll}
        disabled={rolling}
        className="group relative px-12 py-4 text-lg font-bold tracking-wide rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: rolling
            ? 'linear-gradient(135deg, #78716c, #57534e)'
            : 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
          boxShadow: rolling
            ? 'none'
            : '0 10px 40px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)',
          transform: rolling ? 'scale(0.98)' : 'scale(1)'
        }}
      >
        <span className="relative z-10 text-slate-950 flex items-center gap-3">
          {rolling ? (
            <>
              <LoadingSpinner />
              OPENING...
            </>
          ) : (
            <>
              <PlusIcon />
              OPEN CASE
            </>
          )}
        </span>

        {/* Shine effect on hover */}
        {!rolling && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        )}
      </button>

      {/* Auto-Roll Toggle */}
      <button
        onClick={onToggleAutoRoll}
        className={`group relative px-6 py-4 text-sm font-bold tracking-wide rounded-xl overflow-hidden transition-all duration-300 ${autoRoll ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''
          }`}
        style={{
          background: autoRoll
            ? 'linear-gradient(135deg, #10b981, #059669, #047857)'
            : 'linear-gradient(135deg, #6b7280, #4b5563, #374151)',
          boxShadow: autoRoll
            ? '0 10px 40px rgba(16, 185, 129, 0.3)'
            : '0 4px 20px rgba(107, 114, 128, 0.2)'
        }}
      >
        <span className="relative z-10 text-white flex items-center gap-2">
          {autoRoll ? (
            <>
              <CheckIcon />
              AUTO ON
            </>
          ) : (
            <>
              <RefreshIcon />
              AUTO
            </>
          )}
        </span>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </button>
    </div>
  );
}

// Simple icon components
function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
