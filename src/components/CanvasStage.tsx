import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationConfig } from '../types';
import { COLOR_PRESETS } from '../lib/colorPalettes';
import { globalAudioEngine } from '../lib/audioEngine';
import { ParticleTrailsEngine } from '../modes/particleTrails';
import { FluidMotionEngine } from '../modes/fluidMotion';
import { GravityPlaygroundEngine } from '../modes/gravityPlayground';
import { NeuralNetworkEngine } from '../modes/neuralNetwork';
import { SymmetryPainterEngine } from '../modes/symmetryPainter';
import { ParticleExplosionsEngine } from '../modes/particleExplosions';
import { WaveFieldEngine } from '../modes/waveField';
import { OrbitalDanceEngine } from '../modes/orbitalDance';
import { ElectricStormEngine } from '../modes/electricStorm';
import { ThreeUniverseEngine } from '../modes/threeUniverse';
import { AudioReactiveEngine } from '../modes/audioReactive';
import { TextMorphingEngine } from '../modes/textMorphing';

interface CanvasStageProps {
  config: SimulationConfig;
  isPaused: boolean;
  onFpsUpdate: (fps: number, frameTimeMs: number) => void;
  canvasRefOut?: (canvas: HTMLCanvasElement | null) => void;
  gravityEngineRef?: (engine: GravityPlaygroundEngine | null) => void;
  symmetryEngineRef?: (engine: SymmetryPainterEngine | null) => void;
  textEngineRef?: (engine: TextMorphingEngine | null) => void;
  explosionsEngineRef?: (engine: ParticleExplosionsEngine | null) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  config,
  isPaused,
  onFpsUpdate,
  canvasRefOut,
  gravityEngineRef,
  symmetryEngineRef,
  textEngineRef,
  explosionsEngineRef,
}) => {
  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);

  // Engine instances
  const trailsEngine = useRef(new ParticleTrailsEngine());
  const fluidEngine = useRef(new FluidMotionEngine());
  const gravityEngine = useRef(new GravityPlaygroundEngine());
  const neuralEngine = useRef(new NeuralNetworkEngine());
  const symmetryEngine = useRef(new SymmetryPainterEngine());
  const explosionsEngine = useRef(new ParticleExplosionsEngine());
  const waveEngine = useRef(new WaveFieldEngine());
  const orbitalEngine = useRef(new OrbitalDanceEngine());
  const electricEngine = useRef(new ElectricStormEngine());
  const universe3DEngine = useRef(new ThreeUniverseEngine());
  const audioEngine = useRef(new AudioReactiveEngine());
  const textEngine = useRef(new TextMorphingEngine());

  // Pass engine references upward
  useEffect(() => {
    if (gravityEngineRef) gravityEngineRef(gravityEngine.current);
    if (symmetryEngineRef) symmetryEngineRef(symmetryEngine.current);
    if (textEngineRef) textEngineRef(textEngine.current);
    if (explosionsEngineRef) explosionsEngineRef(explosionsEngine.current);
  }, [gravityEngineRef, symmetryEngineRef, textEngineRef, explosionsEngineRef]);

  // Mouse & Touch interaction state
  const mouseState = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    prevX: window.innerWidth / 2,
    prevY: window.innerHeight / 2,
    isDown: false,
    hasClicked: false,
  });

  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(performance.now());

  // Resize handler
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas2DRef.current) {
      canvas2DRef.current.width = width;
      canvas2DRef.current.height = height;
    }
    if (canvas3DRef.current) {
      canvas3DRef.current.width = width;
      canvas3DRef.current.height = height;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Pass active canvas for exports
  useEffect(() => {
    if (canvasRefOut) {
      canvasRefOut(config.mode === 'universe3d' ? canvas3DRef.current : canvas2DRef.current);
    }
  }, [config.mode, canvasRefOut]);

  // Reset mode state when switching
  useEffect(() => {
    if (config.mode === 'trails') trailsEngine.current.reset();
    if (config.mode === 'fluid') fluidEngine.current.reset();
    if (config.mode === 'wavefield') waveEngine.current.reset();
    if (config.mode === 'explosions') explosionsEngine.current.reset();
  }, [config.mode]);

  // Animation Loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Track FPS
      frameCountRef.current++;
      if (time - fpsTimerRef.current >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / (time - fpsTimerRef.current));
        onFpsUpdate(fps, Math.round(deltaTime * 1000));
        frameCountRef.current = 0;
        fpsTimerRef.current = time;
      }

      const activePreset = COLOR_PRESETS[config.colorPreset] || COLOR_PRESETS.neon;
      const colors = config.colorPreset === 'custom' && config.customColors?.length > 0
        ? config.customColors
        : activePreset.colors;

      const currentMouse = mouseState.current;

      if (!isPaused) {
        if (config.mode === 'universe3d' && canvas3DRef.current) {
          universe3DEngine.current.updateAndDraw(
            canvas3DRef.current,
            canvas3DRef.current.width,
            canvas3DRef.current.height,
            config,
            colors,
            { x: currentMouse.x, y: currentMouse.y, isDown: currentMouse.isDown },
            deltaTime
          );
        } else if (canvas2DRef.current) {
          const ctx = canvas2DRef.current.getContext('2d');
          if (ctx) {
            const width = canvas2DRef.current.width;
            const height = canvas2DRef.current.height;

            switch (config.mode) {
              case 'trails':
                trailsEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'fluid':
                fluidEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'gravity':
                gravityEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'neural':
                neuralEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'symmetry':
                symmetryEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'explosions':
                explosionsEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'wavefield':
                waveEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'orbital':
                orbitalEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'electric':
                electricEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
              case 'audio': {
                const analysis = globalAudioEngine.getAnalysis(config.audioSensitivity);
                audioEngine.current.updateAndDraw(ctx, width, height, config, colors, analysis, currentMouse, deltaTime);
                break;
              }
              case 'text':
                textEngine.current.updateAndDraw(ctx, width, height, config, colors, currentMouse, deltaTime);
                break;
            }
          }
        }
      }

      // Update previous mouse coordinates
      currentMouse.prevX = currentMouse.x;
      currentMouse.prevY = currentMouse.y;
      currentMouse.hasClicked = false;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [config, isPaused, onFpsUpdate]);

  // Pointer event listeners
  const onPointerDown = (e: React.PointerEvent) => {
    mouseState.current.isDown = true;
    mouseState.current.hasClicked = true;
    mouseState.current.x = e.clientX;
    mouseState.current.y = e.clientY;

    if (config.mode === 'gravity') {
      gravityEngine.current.handleMouseDown(e.clientX, e.clientY);
    }
    if (config.mode === 'electric') {
      electricEngine.current.handleMouseDown(e.clientX, e.clientY);
    }
    if (config.mode === 'explosions' || config.mouseInteraction === 'explode') {
      const colors = COLOR_PRESETS[config.colorPreset]?.colors || COLOR_PRESETS.neon.colors;
      explosionsEngine.current.explode(e.clientX, e.clientY, colors, config.interactionStrength);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    mouseState.current.x = e.clientX;
    mouseState.current.y = e.clientY;
  };

  const onPointerUp = () => {
    mouseState.current.isDown = false;
    if (config.mode === 'gravity') {
      gravityEngine.current.handleMouseUp();
    }
    if (config.mode === 'electric') {
      electricEngine.current.handleMouseUp();
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-crosshair touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* 2D Canvas for all 2D modes */}
      <canvas
        ref={canvas2DRef}
        className={`absolute inset-0 w-full h-full ${config.mode === 'universe3d' ? 'hidden' : 'block'}`}
      />

      {/* 3D WebGL Canvas for 3D Universe mode */}
      <canvas
        ref={canvas3DRef}
        className={`absolute inset-0 w-full h-full ${config.mode === 'universe3d' ? 'block' : 'hidden'}`}
      />
    </div>
  );
};
