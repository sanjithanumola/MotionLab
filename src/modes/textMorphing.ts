import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface TextParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export class TextMorphingEngine {
  private particles: TextParticle[] = [];
  private currentText = '';
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offCanvas = document.createElement('canvas');
    this.offCtx = this.offCanvas.getContext('2d');
  }

  public setText(text: string, width: number, height: number, colors: string[]) {
    if (!this.offCtx || !text) return;

    this.offCanvas.width = width;
    this.offCanvas.height = height;

    this.offCtx.clearRect(0, 0, width, height);
    this.offCtx.fillStyle = '#ffffff';

    // Calculate font size dynamically based on text length and width
    const fontSize = Math.min(130, Math.floor((width * 0.8) / Math.max(text.length * 0.65, 3)));
    this.offCtx.font = `900 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    this.offCtx.textAlign = 'center';
    this.offCtx.textBaseline = 'middle';
    this.offCtx.fillText(text.toUpperCase(), width / 2, height / 2);

    const imgData = this.offCtx.getImageData(0, 0, width, height).data;
    const targets: { x: number; y: number }[] = [];
    const step = 6; // Grid sample step

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (imgData[index + 3] > 128) {
          targets.push({ x, y });
        }
      }
    }

    // Match existing particles to targets or spawn new ones
    const newParticles: TextParticle[] = [];
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const existing = this.particles[i];

      if (existing) {
        existing.originX = target.x;
        existing.originY = target.y;
        existing.color = samplePaletteColor(colors, target.x / width);
        newParticles.push(existing);
      } else {
        newParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          originX: target.x,
          originY: target.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: samplePaletteColor(colors, target.x / width),
          size: Math.random() * 2 + 2,
        });
      }
    }

    this.particles = newParticles;
    this.currentText = text;
  }

  public reset() {
    this.currentText = '';
    this.particles = [];
  }

  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: SimulationConfig,
    colors: string[],
    mouse: { x: number; y: number; prevX: number; prevY: number; isDown: boolean },
    deltaTime: number
  ) {
    const text = config.morphText || 'MOTION';
    if (text !== this.currentText || this.particles.length === 0) {
      this.setText(text, width, height, colors);
    }

    // Dark clear
    ctx.fillStyle = `rgba(3, 5, 14, ${Math.max(0.12, config.trailFading)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 14;
    }

    const springStrength = 0.08 * config.speed;
    const friction = 0.88;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Spring force returning particle to letter target
      const dxOrigin = p.originX - p.x;
      const dyOrigin = p.originY - p.y;
      p.vx += dxOrigin * springStrength;
      p.vy += dyOrigin * springStrength;

      // Mouse disruption: blows away particles like sand
      const dxMouse = mouse.x - p.x;
      const dyMouse = mouse.y - p.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse < config.interactionRadius && distMouse > 0) {
        const force = (1 - distMouse / config.interactionRadius) * 16 * config.interactionStrength;
        if (config.mouseInteraction === 'attract') {
          p.vx += (dxMouse / distMouse) * force * 0.5;
          p.vy += (dyMouse / distMouse) * force * 0.5;
        } else {
          // Repel or swirl away
          p.vx -= (dxMouse / distMouse) * force;
          p.vy -= (dyMouse / distMouse) * force;
        }
      }

      p.vx *= friction;
      p.vy *= friction;

      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (config.particleSize * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
