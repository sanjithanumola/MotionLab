import React, { useState, useEffect } from 'react';
import { Preset, SimulationConfig } from '../types';
import { DEFAULT_PRESETS } from '../lib/defaultPresets';
import { Bookmark, Sparkles, Plus, Trash2, Share2, Check, X } from 'lucide-react';

interface PresetGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: Preset) => void;
  currentConfig: SimulationConfig;
}

export const PresetGalleryModal: React.FC<PresetGalleryModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  currentConfig,
}) => {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('motionlab_custom_presets');
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  if (!isOpen) return null;

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: 'custom_' + Date.now(),
      name: newPresetName.trim(),
      description: `Custom artwork configuration (${currentConfig.mode})`,
      mode: currentConfig.mode,
      config: { ...currentConfig },
    };

    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    try {
      localStorage.setItem('motionlab_custom_presets', JSON.stringify(updated));
    } catch {
      // Ignored
    }
    setNewPresetName('');
  };

  const deleteCustomPreset = (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('motionlab_custom_presets', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const copyShareableLink = () => {
    const serialized = encodeURIComponent(
      JSON.stringify({
        mode: currentConfig.mode,
        palette: currentConfig.colorPreset,
        particles: currentConfig.particleCount,
        speed: currentConfig.speed,
        glow: currentConfig.glowIntensity,
        interaction: currentConfig.mouseInteraction,
      })
    );
    const shareUrl = `${window.location.origin}${window.location.pathname}#config=${serialized}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Preset Gallery</h2>
              <p className="text-xs text-slate-400">Load curated visual styles or save your own</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Preset Strip */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <input
            type="text"
            placeholder="Save current setup as preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsPreset()}
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={saveCurrentAsPreset}
            disabled={!newPresetName.trim()}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </button>
          <button
            onClick={copyShareableLink}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
            title="Copy shareable URL link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share URL'}</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Custom Presets */}
          {customPresets.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                My Saved Presets ({customPresets.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between group transition-colors"
                  >
                    <div
                      className="flex-1 cursor-pointer pr-2"
                      onClick={() => {
                        onApplyPreset(preset);
                        onClose();
                      }}
                    >
                      <h4 className="text-xs font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize">{preset.mode} mode</p>
                    </div>
                    <button
                      onClick={() => deleteCustomPreset(preset.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Presets */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Curated Masterpieces
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset);
                    onClose();
                  }}
                  className="p-3.5 bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{preset.name}</span>
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {preset.mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
