import React from 'react';
import { Sparkles, Maximize2, Minimize2, Dices, Play, Pause, Camera } from 'lucide-react';
import { AnimationMode } from '../types';

interface TopNavProps {
  currentMode: AnimationMode;
  onSelectMode: (mode: AnimationMode) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRandomize: () => void;
  onOpenPresets: () => void;
  onOpenRecord: () => void;
  onOpenShortcuts: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isPaused,
  onTogglePause,
  onRandomize,
  onOpenPresets,
  onOpenRecord,
  onOpenShortcuts,
  isFullscreen,
  onToggleFullscreen,
  isControlsOpen,
  onToggleControls,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span>MotionLab</span>
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        <button
          onClick={onToggleControls}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${isControlsOpen ? 'text-cyan-400' : ''}`}
        >
          Studio Controls
        </button>
        <button
          onClick={onOpenPresets}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Preset Gallery
        </button>
        <button
          onClick={onOpenRecord}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Record & Export
        </button>
        <button
          onClick={onOpenShortcuts}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
        >
          Key Shortcuts
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={isPaused ? 'Resume animation' : 'Pause animation'}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={onRandomize}
          title="Randomize Parameters (R)"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Randomize animation parameters"
        >
          <Dices className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onOpenRecord}
          title="Take Snapshot / Record (PNG / Video)"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Capture snapshot or video"
        >
          <Camera className="w-4 h-4 text-pink-400" />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Zen Fullscreen (F)'}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleControls}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 active:scale-95 transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap shrink-0"
        >
          {isControlsOpen ? 'Hide Studio' : 'Open Studio'}
        </button>
      </div>
    </header>
  );
};
