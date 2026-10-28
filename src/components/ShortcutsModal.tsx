import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Pause or resume simulation playback' },
    { key: 'R', desc: 'Randomize animation parameters & colors' },
    { key: 'F', desc: 'Toggle Zen Fullscreen studio canvas' },
    { key: 'M', desc: 'Cycle to next animation mode' },
    { key: 'E', desc: 'Trigger particle explosion at cursor' },
    { key: 'C', desc: 'Clear artwork canvas or reset state' },
    { key: 'S', desc: 'Toggle studio parameter controls drawer' },
    { key: 'Click / Drag', desc: 'Push fluid, warp gravity, draw, or arc electricity' },
    { key: 'Touch / Pinch', desc: 'Multi-touch ripples, rotation, and fluid trails' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Keyboard & Gesture Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="divide-y divide-slate-800/80">
            {shortcuts.map((sc, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300">{sc.desc}</span>
                <kbd className="px-2 py-1 bg-slate-950 border border-slate-700/80 rounded-md font-mono text-[11px] text-cyan-300 font-semibold shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
