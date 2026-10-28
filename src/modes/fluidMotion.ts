import { SimulationConfig } from '../types';
import { samplePaletteColor, hexToRgb } from '../lib/colorPalettes';

interface FluidTracer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class FluidMotionEngine {
  private gridW = 64;
  private gridH = 36;
  private u: Float32Array;
  private v: Float32Array;
  private uPrev: Float32Array;
  private vPrev: Float32Array;
  private densityR: Float32Array;
  private densityG: Float32Array;
  private densityB: Float32Array;
  private tracers: FluidTracer[] = [];
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D | null;

  constructor() {
    const size = this.gridW * this.gridH;
    this.u = new Float32Array(size);
    this.v = new Float32Array(size);
    this.uPrev = new Float32Array(size);
    this.vPrev = new Float32Array(size);
    this.densityR = new Float32Array(size);
    this.densityG = new Float32Array(size);
    this.densityB = new Float32Array(size);

    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width = this.gridW;
    this.offCanvas.height = this.gridH;
    this.offCtx = this.offCanvas.getContext('2d');
  }

  public reset() {
    this.u.fill(0);
    this.v.fill(0);
    this.uPrev.fill(0);
    this.vPrev.fill(0);
    this.densityR.fill(0);
    this.densityG.fill(0);
    this.densityB.fill(0);
    this.tracers = [];
  }

  private IX(x: number, y: number): number {
    return Math.max(0, Math.min(this.gridW - 1, x)) + Math.max(0, Math.min(this.gridH - 1, y)) * this.gridW;
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
    const dx = mouse.x - mouse.prevX;
    const dy = mouse.y - mouse.prevY;
    const mouseSpeed = Math.sqrt(dx * dx + dy * dy);

    // Map screen mouse coordinates to fluid grid coordinates
    const gx = Math.floor((mouse.x / width) * this.gridW);
    const gy = Math.floor((mouse.y / height) * this.gridH);

    // Inject force and color density on mouse movement or click
    if ((mouseSpeed > 0.5 || mouse.isDown) && gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
      const radius = 3;
      const rgb = hexToRgb(samplePaletteColor(colors, Math.random()));
      const forceMultiplier = (mouse.isDown ? 2.5 : 1.2) * config.speed;

      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const curX = gx + ox;
          const curY = gy + oy;
          if (curX >= 1 && curX < this.gridW - 1 && curY >= 1 && curY < this.gridH - 1) {
            const d = Math.sqrt(ox * ox + oy * oy);
            if (d <= radius) {
              const factor = (1 - d / radius);
              const idx = this.IX(curX, curY);

              if (config.mouseInteraction === 'swirl') {
                this.u[idx] += -dy * factor * forceMultiplier * 0.4;
                this.v[idx] += dx * factor * forceMultiplier * 0.4;
              } else {
                this.u[idx] += dx * factor * forceMultiplier * 0.3;
                this.v[idx] += dy * factor * forceMultiplier * 0.3;
              }

              this.densityR[idx] = Math.min(255, this.densityR[idx] + rgb.r * factor * 0.8);
              this.densityG[idx] = Math.min(255, this.densityG[idx] + rgb.g * factor * 0.8);
              this.densityB[idx] = Math.min(255, this.densityB[idx] + rgb.b * factor * 0.8);
            }
          }
        }
      }

      // Spawn tracers
      for (let i = 0; i < 4; i++) {
        if (this.tracers.length < 500) {
          this.tracers.push({
            x: mouse.x + (Math.random() - 0.5) * 20,
            y: mouse.y + (Math.random() - 0.5) * 20,
            vx: dx * 0.3 + (Math.random() - 0.5) * 2,
            vy: dy * 0.3 + (Math.random() - 0.5) * 2,
            color: samplePaletteColor(colors, Math.random()),
            size: Math.random() * 2.5 + 1,
            life: 0,
            maxLife: 60 + Math.random() * 40,
          });
        }
      }
    }

    // Velocity dissipation and advection
    const decay = 0.985 - config.trailFading * 0.05;
    for (let i = 0; i < this.u.length; i++) {
      this.u[i] *= decay;
      this.v[i] *= decay;
      this.densityR[i] *= decay;
      this.densityG[i] *= decay;
      this.densityB[i] *= decay;
    }

    // Render fluid density to offscreen canvas
    if (this.offCtx) {
      const imgData = this.offCtx.createImageData(this.gridW, this.gridH);
      const data = imgData.data;

      for (let i = 0; i < this.gridW * this.gridH; i++) {
        const p = i * 4;
        data[p] = Math.min(255, Math.floor(this.densityR[i]));
        data[p + 1] = Math.min(255, Math.floor(this.densityG[i]));
        data[p + 2] = Math.min(255, Math.floor(this.densityB[i]));
        const intensity = (this.densityR[i] + this.densityG[i] + this.densityB[i]) / 3;
        data[p + 3] = Math.min(255, Math.floor(intensity * 1.5));
      }

      this.offCtx.putImageData(imgData, 0, 0);

      // Draw scaled-up fluid field with bilinear smoothing
      ctx.fillStyle = '#03050c';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (config.glowIntensity > 0.1) {
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.drawImage(this.offCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // Update and draw glowing tracer particles riding the fluid field
    ctx.save();
    if (config.glowIntensity > 0.2) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 15;
    }

    const aliveTracers: FluidTracer[] = [];
    for (const t of this.tracers) {
      t.life += deltaTime * 60;
      if (t.life < t.maxLife) {
        const tgx = Math.floor((t.x / width) * this.gridW);
        const tgy = Math.floor((t.y / height) * this.gridH);
        if (tgx >= 0 && tgx < this.gridW && tgy >= 0 && tgy < this.gridH) {
          const idx = this.IX(tgx, tgy);
          t.vx = t.vx * 0.9 + this.u[idx] * 0.3 * config.speed;
          t.vy = t.vy * 0.9 + this.v[idx] * 0.3 * config.speed;
        }

        t.x += t.vx;
        t.y += t.vy;

        const alpha = Math.max(0, 1 - t.life / t.maxLife);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();

        aliveTracers.push(t);
      }
    }
    this.tracers = aliveTracers;
    ctx.restore();
  }
}
