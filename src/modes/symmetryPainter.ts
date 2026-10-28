import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface SymmetrySpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export class SymmetryPainterEngine {
  private persistentCanvas: HTMLCanvasElement | null = null;
  private pCtx: CanvasRenderingContext2D | null = null;
  private sparks: SymmetrySpark[] = [];
  private autoTime = 0;
  private autoAngle = 0;
  private autoRadius = 150;
  private rotationAngle = 0;

  private ensureCanvas(width: number, height: number) {
    if (!this.persistentCanvas || this.persistentCanvas.width !== width || this.persistentCanvas.height !== height) {
      this.persistentCanvas = document.createElement('canvas');
      this.persistentCanvas.width = width;
      this.persistentCanvas.height = height;
      this.pCtx = this.persistentCanvas.getContext('2d');
      if (this.pCtx) {
        this.pCtx.lineCap = 'round';
        this.pCtx.lineJoin = 'round';
      }
    }
  }

  public clear(width?: number, height?: number) {
    if (this.pCtx && this.persistentCanvas) {
      this.pCtx.clearRect(0, 0, this.persistentCanvas.width, this.persistentCanvas.height);
    }
    this.sparks = [];
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
    this.ensureCanvas(width, height);
    if (!this.pCtx || !this.persistentCanvas) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const folds = config.symmetryFolds || 8;
    const angleStep = (Math.PI * 2) / folds;

    // Check if user is actively drawing, or run gentle generative harmonograph motion when idle
    const isDrawing = mouse.isDown;
    let currX = mouse.x;
    let currY = mouse.y;
    let lastX = mouse.prevX;
    let lastY = mouse.prevY;

    if (!isDrawing) {
      this.autoTime += deltaTime * config.speed;
      this.autoAngle += 0.02 * config.speed;
      this.autoRadius = 120 + Math.sin(this.autoTime * 0.7) * 90 + Math.cos(this.autoTime * 1.3) * 60;
      currX = centerX + Math.cos(this.autoAngle) * this.autoRadius;
      currY = centerY + Math.sin(this.autoAngle) * this.autoRadius;
      const prevAutoAngle = this.autoAngle - 0.02 * config.speed;
      const prevRadius = 120 + Math.sin((this.autoTime - deltaTime * config.speed) * 0.7) * 90;
      lastX = centerX + Math.cos(prevAutoAngle) * prevRadius;
      lastY = centerY + Math.sin(prevAutoAngle) * prevRadius;
    }

    // Relative vectors from center
    const dx1 = lastX - centerX;
    const dy1 = lastY - centerY;
    const dx2 = currX - centerX;
    const dy2 = currY - centerY;

    const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const a1 = Math.atan2(dy1, dx1);
    const a2 = Math.atan2(dy2, dx2);

    const strokeColor = samplePaletteColor(colors, (a2 + Math.PI) / (Math.PI * 2));

    // Paint symmetrically onto persistent canvas
    this.pCtx.save();
    this.pCtx.translate(centerX, centerY);
    if (config.glowIntensity > 0.2) {
      this.pCtx.shadowBlur = config.glowIntensity * 18;
      this.pCtx.shadowColor = strokeColor;
    }
    this.pCtx.strokeStyle = strokeColor;
    this.pCtx.lineWidth = Math.max(1.5, config.particleSize);

    for (let i = 0; i < folds; i++) {
      const baseAngle = i * angleStep;

      // Normal sector
      this.pCtx.beginPath();
      const x1 = Math.cos(baseAngle + a1) * r1;
      const y1 = Math.sin(baseAngle + a1) * r1;
      const x2 = Math.cos(baseAngle + a2) * r2;
      const y2 = Math.sin(baseAngle + a2) * r2;
      this.pCtx.moveTo(x1, y1);
      this.pCtx.lineTo(x2, y2);
      this.pCtx.stroke();

      // Mirrored reflection sector
      this.pCtx.beginPath();
      const rx1 = Math.cos(baseAngle - a1) * r1;
      const ry1 = Math.sin(baseAngle - a1) * r1;
      const rx2 = Math.cos(baseAngle - a2) * r2;
      const ry2 = Math.sin(baseAngle - a2) * r2;
      this.pCtx.moveTo(rx1, ry1);
      this.pCtx.lineTo(rx2, ry2);
      this.pCtx.stroke();
    }
    this.pCtx.restore();

    // Render persistent canvas to stage with slow optional rotation or fade
    ctx.fillStyle = '#03050c';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.drawImage(this.persistentCanvas, 0, 0);

    // Draw active cursor indicators across the symmetry axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.translate(centerX, centerY);

    for (let i = 0; i < folds; i++) {
      const baseAngle = i * angleStep;
      const cx = Math.cos(baseAngle + a2) * r2;
      const cy = Math.sin(baseAngle + a2) * r2;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
