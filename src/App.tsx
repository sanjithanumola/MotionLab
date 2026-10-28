import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationConfig,
  AnimationMode,
  ColorPresetId,
  MouseInteraction,
  Preset,
} from './types';
import { COLOR_PRESETS } from './lib/colorPalettes';
import { DEFAULT_PRESETS } from './lib/defaultPresets';
import { TopNav } from './components/TopNav';
import { CanvasStage } from './components/CanvasStage';
import { ControlPanel } from './components/ControlPanel';
import { ModeBar } from './components/ModeBar';
import { PresetGalleryModal } from './components/PresetGalleryModal';
import { RecordExportModal } from './components/RecordExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PerformanceOverlay } from './components/PerformanceOverlay';
import { GravityPlaygroundEngine } from './modes/gravityPlayground';
import { SymmetryPainterEngine } from './modes/symmetryPainter';
import { TextMorphingEngine } from './modes/textMorphing';
import { ParticleExplosionsEngine } from './modes/particleExplosions';

const ALL_MODES: AnimationMode[] = [
  'trails',
  'fluid',
  'gravity',
  'neural',
  'symmetry',
  'explosions',
  'wavefield',
  'orbital',
  'electric',
  'universe3d',
  'audio',
  'text',
];

const ALL_PRESETS: ColorPresetId[] = [
  'neon',
  'fire',
  'ocean',
  'aurora',
  'cyberpunk',
  'solar',
  'monochrome',
  'rainbow',
];

const ALL_INTERACTIONS: MouseInteraction[] = [
  'attract',
  'repel',
  'swirl',
  'explode',
  'gravity_well',
];

const DEFAULT_CONFIG: SimulationConfig = {
  mode: 'trails',
  colorPreset: 'neon',
  customColors: [],
  particleCount: 600,
  speed: 1.0,
  glowIntensity: 0.7,
  particleSize: 3.5,
  trailFading: 0.12,
  mouseInteraction: 'attract',
  interactionRadius: 180,
  interactionStrength: 1.2,
  symmetryFolds: 8,
  waveFrequency: 1.8,
  waveAmplitude: 35,
  neuralDistance: 120,
  lightningBranches: 5,
  morphText: 'MOTION',
  threeGeometry: 'galaxy',
  audioSource: 'synth',
  audioSensitivity: 1.2,
  synthStyle: 'synthwave',
};

export default function App() {
  const [config, setConfig] = useState<SimulationConfig>(() => {
    // Check URL hash for shared configuration
    try {
      if (window.location.hash.includes('config=')) {
        const jsonStr = decodeURIComponent(window.location.hash.split('config=')[1]);
        const parsed = JSON.parse(jsonStr);
        return {
          ...DEFAULT_CONFIG,
          mode: parsed.mode || DEFAULT_CONFIG.mode,
          colorPreset: parsed.palette || DEFAULT_CONFIG.colorPreset,
          particleCount: parsed.particles || DEFAULT_CONFIG.particleCount,
          speed: parsed.speed || DEFAULT_CONFIG.speed,
          glowIntensity: parsed.glow ?? DEFAULT_CONFIG.glowIntensity,
          mouseInteraction: parsed.interaction || DEFAULT_CONFIG.mouseInteraction,
        };
      }
    } catch {
      // Ignored
    }
    return DEFAULT_CONFIG;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Performance telemetry
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(16);
  const [isAutoOptimize, setIsAutoOptimize] = useState(true);
  const lowFpsCountRef = useRef(0);

  // Active canvas & engine references
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gravityEngineRef = useRef<GravityPlaygroundEngine | null>(null);
  const symmetryEngineRef = useRef<SymmetryPainterEngine | null>(null);
  const textEngineRef = useRef<TextMorphingEngine | null>(null);
  const explosionsEngineRef = useRef<ParticleExplosionsEngine | null>(null);

  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Performance throttling if frame rate drops
  const handleFpsUpdate = useCallback(
    (newFps: number, newFrameTime: number) => {
      setFps(newFps);
      setFrameTimeMs(newFrameTime);

      if (isAutoOptimize && newFps < 32) {
        lowFpsCountRef.current++;
        if (lowFpsCountRef.current >= 3) {
          lowFpsCountRef.current = 0;
          setConfig((prev) => ({
            ...prev,
            particleCount: Math.max(150, Math.floor(prev.particleCount * 0.8)),
          }));
        }
      } else {
        lowFpsCountRef.current = 0;
      }
    },
    [isAutoOptimize]
  );

  // Randomize configuration
  const handleRandomize = useCallback(() => {
    const randomMode = ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
    const randomColor = ALL_PRESETS[Math.floor(Math.random() * ALL_PRESETS.length)];
    const randomInter = ALL_INTERACTIONS[Math.floor(Math.random() * ALL_INTERACTIONS.length)];
    const randomSpeed = Math.round((Math.random() * 1.5 + 0.5) * 10) / 10;
    const randomGlow = Math.round((Math.random() * 0.6 + 0.4) * 100) / 100;

    updateConfig({
      mode: randomMode,
      colorPreset: randomColor,
      mouseInteraction: randomInter,
      speed: randomSpeed,
      glowIntensity: randomGlow,
    });
  }, [updateConfig]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
        case 'KeyR':
          handleRandomize();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyM': {
          const currentIndex = ALL_MODES.indexOf(config.mode);
          const nextIndex = (currentIndex + 1) % ALL_MODES.length;
          updateConfig({ mode: ALL_MODES[nextIndex] });
          break;
        }
        case 'KeyC':
          if (config.mode === 'symmetry') {
            symmetryEngineRef.current?.clear();
          } else if (config.mode === 'gravity') {
            gravityEngineRef.current?.clearAdditionalBodies();
          }
          break;
        case 'KeyE': {
          const colors = COLOR_PRESETS[config.colorPreset]?.colors || COLOR_PRESETS.neon.colors;
          explosionsEngineRef.current?.explode(
            window.innerWidth / 2,
            window.innerHeight / 2,
            colors,
            1.5
          );
          break;
        }
        case 'KeyS':
          setIsControlsOpen((c) => !c);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, handleRandomize, toggleFullscreen, updateConfig]);

  // Handle Preset application
  const handleApplyPreset = (preset: Preset) => {
    updateConfig({
      mode: preset.mode,
      ...preset.config,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Header */}
      <TopNav
        currentMode={config.mode}
        onSelectMode={(m) => updateConfig({ mode: m })}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onRandomize={handleRandomize}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenRecord={() => setIsRecordOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isControlsOpen={isControlsOpen}
        onToggleControls={() => setIsControlsOpen((c) => !c)}
      />

      {/* Main Interactive Animation Stage */}
      <main className="absolute inset-0 w-full h-full">
        <CanvasStage
          config={config}
          isPaused={isPaused}
          onFpsUpdate={handleFpsUpdate}
          canvasRefOut={(canvas) => {
            activeCanvasRef.current = canvas;
          }}
          gravityEngineRef={(engine) => {
            gravityEngineRef.current = engine;
          }}
          symmetryEngineRef={(engine) => {
            symmetryEngineRef.current = engine;
          }}
          textEngineRef={(engine) => {
            textEngineRef.current = engine;
          }}
          explosionsEngineRef={(engine) => {
            explosionsEngineRef.current = engine;
          }}
        />
      </main>

      {/* Studio Controls Drawer */}
      <ControlPanel
        config={config}
        onChangeConfig={updateConfig}
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
        gravityEngine={gravityEngineRef.current}
        symmetryEngine={symmetryEngineRef.current}
      />

      {/* Floating Bottom Mode Switcher Dock */}
      <ModeBar
        currentMode={config.mode}
        onSelectMode={(m) => updateConfig({ mode: m })}
        isVisible={!isFullscreen}
      />

      {/* Live Performance Diagnostic HUD */}
      <PerformanceOverlay
        fps={fps}
        frameTimeMs={frameTimeMs}
        particleCount={config.particleCount}
        isAutoOptimize={isAutoOptimize}
        onToggleAutoOptimize={() => setIsAutoOptimize((v) => !v)}
      />

      {/* Modals */}
      <PresetGalleryModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onApplyPreset={handleApplyPreset}
        currentConfig={config}
      />

      <RecordExportModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        getCanvas={() => activeCanvasRef.current}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
