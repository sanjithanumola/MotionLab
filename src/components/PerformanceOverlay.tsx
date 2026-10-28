import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface PerformanceOverlayProps {
  fps: number;
  frameTimeMs: number;
  particleCount: number;
  isAutoOptimize: boolean;
  onToggleAutoOptimize: () => void;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  fps,
  frameTimeMs,
  particleCount,
  isAutoOptimize,
  onToggleAutoOptimize,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fpsColor =
    fps >= 50
      ? 'text-emerald-400'
      : fps >= 30
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="fixed bottom-4 left-4 z-30 select-none">
      <div className="bg-slate-950/70 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-3 text-xs">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
          title="Toggle performance diagnostics"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className={`font-mono font-semibold tabular-nums ${fpsColor}`}>
            {fps} <span className="text-[10px] font-normal text-slate-400">FPS</span>
          </span>
        </button>

        <span className="text-slate-600">·</span>

        <span className="font-mono text-slate-300 tabular-nums">
          {frameTimeMs} <span className="text-[10px] text-slate-500">ms</span>
        </span>

        {isExpanded && (
          <>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {particleCount} <span className="text-[10px] text-slate-500">particles</span>
            </span>
            <span className="text-slate-600">·</span>
            <button
              onClick={onToggleAutoOptimize}
              className={`text-[11px] font-medium transition-colors ${
                isAutoOptimize ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Auto-Throttle {isAutoOptimize ? 'ON' : 'OFF'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
