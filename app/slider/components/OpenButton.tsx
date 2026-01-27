interface OpenButtonProps {
  rolling: boolean;
  onStartRoll: () => void;
}

export default function OpenButton({ rolling, onStartRoll }: OpenButtonProps) {
  return (
    <div className="relative z-20 mt-8 flex justify-center">
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
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              OPENING...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              OPEN CASE
            </>
          )}
        </span>
        
        {!rolling && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        )}
      </button>
    </div>
  );
}
