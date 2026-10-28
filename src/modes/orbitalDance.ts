import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface OrbitalDancer {
  angle: number;
  speed: number;
  radius: number;
  color: string;
  history: { x: number; y: number }[];
}

export class OrbitalDanceEngine {
  private dancers: OrbitalDancer[] = [];
  private time = 0;
  private isInitialized = false;

  public init(count: number, colors: string[]) {
    this.dancers = [];
    for (let i = 0; i < count; i++) {
      this.dancers.push({
        angle: (i / count) * Math.PI * 2,
        speed: (0.8 + (i % 5) * 0.3) * 0.02,
        radius: 40 + (i % 8) * 35,
        color: samplePaletteColor(colors, i / count),
        history: [],
      });
    }
    this.isInitialized = true;
  }

  public reset(count: number, colors: string[]) {
    this.init(count, colors);
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
    const dancerCount = Math.min(config.particleCount, 300);
    if (!this.isInitialized || this.dancers.length !== dancerCount) {
      this.init(dancerCount, colors);
    }

    this.time += deltaTime * config.speed;

    // Fading canvas clear for long glowing harmonic trails
    ctx.fillStyle = `rgba(3, 4, 10, ${Math.max(0.04, config.trailFading)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 16;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Harmonograph attractor positions
    const a1x = centerX + Math.cos(this.time * 0.8) * 160;
    const a1y = centerY + Math.sin(this.time * 1.2) * 120;

    const a2x = mouse.x; // Cursor is second attractor!
    const a2y = mouse.y;

    const a3x = centerX + Math.cos(-this.time * 1.5) * 200;
    const a3y = centerY + Math.sin(this.time * 0.9) * 180;

    // Draw attractor nodes
    const attractors = [
      { x: a1x, y: a1y, col: colors[0] || '#00f0ff', label: 'HARMONIC I' },
      { x: a2x, y: a2y, col: colors[1] || '#ff007b', label: 'CURSOR FOCUS' },
      { x: a3x, y: a3y, col: colors[2] || '#ffe600', label: 'HARMONIC II' },
    ];

    for (const att of attractors) {
      ctx.fillStyle = att.col;
      ctx.shadowColor = att.col;
      ctx.beginPath();
      ctx.arc(att.x, att.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update and draw dancer particles tracing spirograph lines
    for (let i = 0; i < this.dancers.length; i++) {
      const d = this.dancers[i];
      d.angle += d.speed * config.speed;

      // Complex multi-epicyclic position
      const phase1 = d.angle * 2.5;
      const phase2 = d.angle * 1.666;
      const phase3 = d.angle * 0.75;

      const px =
        centerX * 0.4 +
        (a1x * 0.3 + Math.cos(phase1) * d.radius) +
        (a2x * 0.3 + Math.sin(phase2) * (d.radius * 0.7)) +
        (a3x * 0.2 + Math.cos(phase3) * (d.radius * 0.5));

      const py =
        centerY * 0.4 +
        (a1y * 0.3 + Math.sin(phase1) * d.radius) +
        (a2y * 0.3 + Math.cos(phase2) * (d.radius * 0.7)) +
        (a3y * 0.2 + Math.sin(phase3) * (d.radius * 0.5));

      d.history.push({ x: px, y: py });
      if (d.history.length > 25) {
        d.history.shift();
      }

      // Draw particle trail
      ctx.strokeStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let h = 0; h < d.history.length; h++) {
        const pt = d.history[h];
        if (h === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Head particle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, config.particleSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
