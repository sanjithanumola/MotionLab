import { ColorPreset, ColorPresetId } from '../types';

export const COLOR_PRESETS: Record<ColorPresetId, ColorPreset> = {
  neon: {
    id: 'neon',
    name: 'Neon Cyber',
    colors: ['#00f0ff', '#7000ff', '#ff007b', '#00ffc2', '#ff00aa'],
    background: '#04050d',
  },
  fire: {
    id: 'fire',
    name: 'Solar Flare',
    colors: ['#ff1f00', '#ff6200', '#ffa600', '#ffd23f', '#ffffff'],
    background: '#0b0402',
  },
  ocean: {
    id: 'ocean',
    name: 'Abyssal Ocean',
    colors: ['#0077b6', '#00b4d8', '#90e0ef', '#48cae4', '#023e8a'],
    background: '#020b14',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    colors: ['#00ff87', '#60efff', '#0061ff', '#ff1361', '#fff800'],
    background: '#040b08',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2099',
    colors: ['#ffe600', '#ff0055', '#00e5ff', '#7928ca', '#00ff88'],
    background: '#0a0512',
  },
  solar: {
    id: 'solar',
    name: 'Gold Horizon',
    colors: ['#f7b267', '#f79d65', '#f4845f', '#f27059', '#f25c54'],
    background: '#0e0804',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Silver',
    colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#64748b', '#e2e8f0'],
    background: '#090a0f',
  },
  rainbow: {
    id: 'rainbow',
    name: 'Prism Spectrum',
    colors: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#6600ff'],
    background: '#06060c',
  },
  custom: {
    id: 'custom',
    name: 'Custom Palette',
    colors: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'],
    background: '#080c14',
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function samplePaletteColor(colors: string[], indexOrRatio: number): string {
  if (!colors || colors.length === 0) return '#00f0ff';
  if (indexOrRatio < 0) indexOrRatio = 0;
  if (indexOrRatio >= 1 && Number.isInteger(indexOrRatio)) {
    return colors[indexOrRatio % colors.length];
  }
  const ratio = Math.min(Math.max(indexOrRatio % 1, 0), 0.999);
  const pos = ratio * (colors.length - 1);
  const idx = Math.floor(pos);
  return colors[idx] || colors[0];
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}
