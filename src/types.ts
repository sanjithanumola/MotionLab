export type AnimationMode =
  | 'trails'
  | 'fluid'
  | 'gravity'
  | 'neural'
  | 'symmetry'
  | 'explosions'
  | 'wavefield'
  | 'orbital'
  | 'electric'
  | 'universe3d'
  | 'audio'
  | 'text';

export type ColorPresetId =
  | 'neon'
  | 'fire'
  | 'ocean'
  | 'aurora'
  | 'cyberpunk'
  | 'solar'
  | 'monochrome'
  | 'rainbow'
  | 'custom';

export type MouseInteraction =
  | 'attract'
  | 'repel'
  | 'swirl'
  | 'explode'
  | 'gravity_well'
  | 'none';

export interface ColorPreset {
  id: ColorPresetId;
  name: string;
  colors: string[];
  background: string;
}

export interface GravityBody {
  id: string;
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  isRepulsor?: boolean;
}

export interface SimulationConfig {
  mode: AnimationMode;
  colorPreset: ColorPresetId;
  customColors: string[];
  particleCount: number;
  speed: number; // 0.1 to 3.0
  glowIntensity: number; // 0 to 1
  particleSize: number; // 1 to 15
  trailFading: number; // 0.02 to 0.5 (lower = longer trails)
  mouseInteraction: MouseInteraction;
  interactionRadius: number; // 50 to 400
  interactionStrength: number; // 0.1 to 3.0

  // Mode-specific configurations
  symmetryFolds: 2 | 4 | 8 | 16 | 32;
  waveFrequency: number;
  waveAmplitude: number;
  neuralDistance: number;
  lightningBranches: number;
  morphText: string;
  threeGeometry: 'galaxy' | 'tunnel' | 'sphere' | 'torus' | 'rings';
  audioSource: 'synth' | 'mic' | 'file';
  audioSensitivity: number;
  synthStyle: 'chillhop' | 'synthwave' | 'cosmic';
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  mode: AnimationMode;
  config: Partial<SimulationConfig>;
}

export interface AudioAnalysisData {
  bass: number; // 0 - 1
  mid: number; // 0 - 1
  treble: number; // 0 - 1
  overallVolume: number; // 0 - 1
  frequencyData: Uint8Array<ArrayBuffer>;
  isBeat: boolean;
}
