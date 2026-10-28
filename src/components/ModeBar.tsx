import React from 'react';
import { AnimationMode } from '../types';
import {
  Sparkles,
  Waves,
  Orbit,
  Network,
  Sun,
  Flame,
  Zap,
  Box,
  Music,
  Type,
  Maximize,
  Compass,
} from 'lucide-react';

interface ModeBarProps {
  currentMode: AnimationMode;
  onSelectMode: (mode: AnimationMode) => void;
  isVisible: boolean;
}

const MODES: { id: AnimationMode; label: string; icon: React.ReactNode }[] = [
  { id: 'trails', label: 'Trails', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'fluid', label: 'Fluid', icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'gravity', label: 'Gravity', icon: <Orbit className="w-3.5 h-3.5" /> },
  { id: 'neural', label: 'Neural', icon: <Network className="w-3.5 h-3.5" /> },
  { id: 'symmetry', label: 'Symmetry', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'explosions', label: 'Explosions', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'wavefield', label: 'WaveField', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'orbital', label: 'Orbital', icon: <Orbit className="w-3.5 h-3.5" /> },
  { id: 'electric', label: 'Electric', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'universe3d', label: '3D Galaxy', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'audio', label: 'Audio', icon: <Music className="w-3.5 h-3.5" /> },
  { id: 'text', label: 'Text Morph', icon: <Type className="w-3.5 h-3.5" /> },
];

export const ModeBar: React.FC<ModeBarProps> = ({ currentMode, onSelectMode, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[90vw] overflow-x-auto p-1.5 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl flex items-center gap-1">
      {MODES.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/25 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};
