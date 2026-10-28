import { SimulationConfig, AudioAnalysisData } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface AudioReactiveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export class AudioReactiveEngine {
  private particles: AudioReactiveParticle[] = [];
  private pulseRadius = 50;

  public reset() {
    this.particles = [];
  }

  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: SimulationConfig,
    colors: string[],
    audioData: AudioAnalysisData,
    mouse: { x: number; y: number; prevX: number; prevY: number; isDown: boolean },
    deltaTime: number
  ) {
    // Fading canvas clear
    ctx.fillStyle = `rgba(3, 5, 15, ${Math.max(0.06, config.trailFading)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 20;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    const bass = audioData.bass;
    const mid = audioData.mid;
    const treble = audioData.treble;
    const isBeat = audioData.isBeat;

    // React core size
    const targetRadius = 60 + bass * 120 + (isBeat ? 40 : 0);
    this.pulseRadius += (targetRadius - this.pulseRadius) * 0.15;

    // Spawn sound-driven particles on beat or volume
    const spawnCount = isBeat ? 16 : Math.floor(treble * 8);
    for (let i = 0; i < spawnCount; i++) {
      if (this.particles.length < 500) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 6 + 2) * (1 + bass * 1.5);
        this.particles.push({
          x: centerX + Math.cos(angle) * this.pulseRadius,
          y: centerY + Math.sin(angle) * this.pulseRadius,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          color: samplePaletteColor(colors, Math.random()),
          alpha: 1,
          life: 0,
          maxLife: 40 + Math.random() * 40,
        });
      }
    }

    // Draw circular audio frequency visualizer spectrum ring
    const binCount = 90;
    const baseRadius = this.pulseRadius + 20;
    const angleStep = (Math.PI * 2) / binCount;

    ctx.lineWidth = 2.5;
    for (let i = 0; i < binCount; i++) {
      const freqVal = audioData.frequencyData ? (audioData.frequencyData[i * 2] || 0) / 255 : 0;
      const barHeight = freqVal * 120 * (config.audioSensitivity || 1);
      const angle = i * angleStep;

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

      const strokeCol = samplePaletteColor(colors, i / binCount);
      ctx.strokeStyle = strokeCol;
      ctx.shadowColor = strokeCol;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw pulsating center energy orb
    const primaryColor = colors[0] || '#00f0ff';
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.pulseRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, primaryColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Secondary mid-frequency ring
    ctx.strokeStyle = colors[1] || '#ff007b';
    ctx.shadowColor = colors[1] || '#ff007b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.pulseRadius * 1.5 + mid * 40, 0, Math.PI * 2);
    ctx.stroke();

    // Update & draw sound particles
    const aliveParticles: AudioReactiveParticle[] = [];
    for (const p of this.particles) {
      p.life += deltaTime * 60;
      if (p.life < p.maxLife) {
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx * config.speed;
        p.y += p.vy * config.speed;

        // Interaction with mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < config.interactionRadius && d > 0) {
          const force = (1 - d / config.interactionRadius) * 2;
          p.vx += (-dy / d) * force;
          p.vy += (dx / d) * force;
        }

        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        aliveParticles.push(p);
      }
    }
    this.particles = aliveParticles;

    ctx.restore();
  }
}
