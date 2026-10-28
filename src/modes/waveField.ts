import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  speed: number;
}

export class WaveFieldEngine {
  private ripples: WaveRipple[] = [];
  private time = 0;

  public reset() {
    this.ripples = [];
    this.time = 0;
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
    this.time += deltaTime * config.speed;

    // Background clear
    ctx.fillStyle = '#030612';
    ctx.fillRect(0, 0, width, height);

    // Create ripple on mouse movement or click
    const mDist = Math.hypot(mouse.x - mouse.prevX, mouse.y - mouse.prevY);
    if ((mDist > 4 || mouse.isDown) && this.ripples.length < 15) {
      this.ripples.push({
        x: mouse.x,
        y: mouse.y,
        radius: 0,
        maxRadius: 280,
        strength: mouse.isDown ? 35 : 18,
        speed: 180 * config.speed,
      });
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed * deltaTime;
      if (rip.radius > rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 14;
    }

    const rows = 28;
    const cols = 55;
    const cellW = width / (cols - 1);
    const cellH = height / (rows - 1);
    const freq = (config.waveFrequency || 1.5) * 0.02;
    const amp = config.waveAmplitude || 30;

    // Draw wavy horizontal lines with 2.5D perspective displacement
    for (let r = 0; r < rows; r++) {
      const rowProgress = r / (rows - 1);
      const strokeColor = samplePaletteColor(colors, rowProgress);
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const baseX = c * cellW;
        const baseY = r * cellH;

        // Base harmonic wave
        let waveOffset =
          Math.sin(baseX * freq + this.time * 2.5 + rowProgress * 4) *
          Math.cos(baseY * freq * 0.7 + this.time * 1.8) *
          amp;

        // Interactive cursor proximity displacement
        const dx = baseX - mouse.x;
        const dy = baseY - mouse.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        if (mouseDist < config.interactionRadius) {
          const force = (1 - mouseDist / config.interactionRadius);
          waveOffset += (mouse.isDown ? -force * 60 : force * 35);
        }

        // Ripple displacement
        for (const rip of this.ripples) {
          const rdx = baseX - rip.x;
          const rdy = baseY - rip.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          const diff = Math.abs(rdist - rip.radius);
          if (diff < 30) {
            const ripFactor = (1 - rip.radius / rip.maxRadius) * (1 - diff / 30);
            waveOffset += Math.sin(diff * 0.2) * rip.strength * ripFactor;
          }
        }

        const plotX = baseX;
        const plotY = baseY + waveOffset;

        if (c === 0) {
          ctx.moveTo(plotX, plotY);
        } else {
          ctx.lineTo(plotX, plotY);
        }
      }
      ctx.stroke();

      // Render glowing nodes along every third intersection
      for (let c = 0; c < cols; c += 3) {
        const baseX = c * cellW;
        const baseY = r * cellH;
        let waveOffset =
          Math.sin(baseX * freq + this.time * 2.5 + rowProgress * 4) *
          Math.cos(baseY * freq * 0.7 + this.time * 1.8) *
          amp;
        const dx = baseX - mouse.x;
        const dy = baseY - mouse.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        if (mouseDist < config.interactionRadius) {
          const force = (1 - mouseDist / config.interactionRadius);
          waveOffset += (mouse.isDown ? -force * 60 : force * 35);
        }

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(baseX, baseY + waveOffset, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
