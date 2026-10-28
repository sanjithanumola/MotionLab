import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface ExplosionDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  flickerSpeed: number;
  hasSecondaryBurst: boolean;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export class ParticleExplosionsEngine {
  private particles: ExplosionDebris[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private autoTimer = 0;

  public explode(x: number, y: number, colors: string[], intensity: number = 1.0) {
    const burstCount = Math.floor(70 * intensity);
    const mainColor = samplePaletteColor(colors, Math.random());

    // Shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 180 * intensity,
      color: mainColor,
      alpha: 1,
    });

    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 8 + 2) * intensity;
      const color = samplePaletteColor(colors, Math.random());

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 50 + Math.random() * 50,
        flickerSpeed: Math.random() * 10 + 5,
        hasSecondaryBurst: Math.random() < 0.2, // 20% chance of secondary pop
      });
    }
  }

  public reset() {
    this.particles = [];
    this.shockwaves = [];
  }

  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: SimulationConfig,
    colors: string[],
    mouse: { x: number; y: number; prevX: number; prevY: number; isDown: boolean; hasClicked?: boolean },
    deltaTime: number
  ) {
    // Fading background for spark trails
    ctx.fillStyle = `rgba(3, 4, 10, ${Math.max(0.08, config.trailFading)})`;
    ctx.fillRect(0, 0, width, height);

    // Click handler trigger
    if (mouse.hasClicked) {
      this.explode(mouse.x, mouse.y, colors, config.interactionStrength);
    }

    // Auto fireworks timer
    this.autoTimer += deltaTime;
    if (this.autoTimer > 1.8) {
      this.autoTimer = 0;
      const rx = width * (0.2 + Math.random() * 0.6);
      const ry = height * (0.2 + Math.random() * 0.5);
      this.explode(rx, ry, colors, 0.9);
    }

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 20;
    }

    // Update & draw shockwaves
    const aliveShockwaves: ShockwaveRing[] = [];
    for (const sw of this.shockwaves) {
      sw.radius += 6 * config.speed;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      if (sw.alpha > 0.01) {
        ctx.strokeStyle = sw.color;
        ctx.shadowColor = sw.color;
        ctx.lineWidth = 3 * sw.alpha;
        ctx.globalAlpha = sw.alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        aliveShockwaves.push(sw);
      }
    }
    this.shockwaves = aliveShockwaves;

    // Update & draw debris sparks
    const aliveParticles: ExplosionDebris[] = [];
    const gravity = 0.12 * config.speed;

    for (const p of this.particles) {
      p.life += deltaTime * 60;

      if (p.life < p.maxLife) {
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += gravity;

        p.x += p.vx * config.speed;
        p.y += p.vy * config.speed;

        // Ground bounce
        if (p.y > height - 10) {
          p.y = height - 10;
          p.vy = -p.vy * 0.6;
          p.vx *= 0.8;
        }

        // Secondary mini burst
        if (p.hasSecondaryBurst && p.life > p.maxLife * 0.5) {
          p.hasSecondaryBurst = false;
          for (let j = 0; j < 6; j++) {
            const a = Math.random() * Math.PI * 2;
            aliveParticles.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(a) * 2,
              vy: Math.sin(a) * 2,
              size: 1.5,
              color: '#ffffff',
              alpha: 1,
              life: 0,
              maxLife: 25,
              flickerSpeed: 8,
              hasSecondaryBurst: false,
            });
          }
        }

        const flicker = (Math.sin(p.life * p.flickerSpeed) + 1) * 0.25 + 0.5;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife) * flicker;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * config.particleSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        aliveParticles.push(p);
      }
    }

    this.particles = aliveParticles;
    ctx.restore();
  }
}
