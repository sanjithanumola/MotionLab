import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

export class ParticleTrailsEngine {
  private particles: TrailParticle[] = [];

  public reset() {
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
    // Semi-transparent background clear for motion blur trail effect
    ctx.fillStyle = `rgba(5, 7, 15, ${Math.max(0.04, config.trailFading)})`;
    ctx.fillRect(0, 0, width, height);

    const mouseDx = mouse.x - mouse.prevX;
    const mouseDy = mouse.y - mouse.prevY;
    const mouseSpeed = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

    // Spawn new particles along cursor trajectory
    const spawnCount = mouse.isDown ? 14 : mouseSpeed > 1 ? Math.min(10, Math.ceil(mouseSpeed / 3)) : 2;
    for (let i = 0; i < spawnCount; i++) {
      if (this.particles.length < config.particleCount) {
        const angle = Math.random() * Math.PI * 2;
        const spreadSpeed = (Math.random() * 2 + 0.5) * config.speed;
        const interpX = mouse.prevX + (mouse.x - mouse.prevX) * (i / spawnCount);
        const interpY = mouse.prevY + (mouse.y - mouse.prevY) * (i / spawnCount);

        this.particles.push({
          x: interpX + (Math.random() - 0.5) * 8,
          y: interpY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * spreadSpeed + mouseDx * 0.15,
          vy: Math.sin(angle) * spreadSpeed + mouseDy * 0.15,
          size: (Math.random() * config.particleSize + 1.5),
          color: samplePaletteColor(colors, Math.random()),
          alpha: 1,
          maxLife: 60 + Math.random() * 80,
          life: 0,
        });
      }
    }

    // Configure composite for neon glow
    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 20;
    }

    const aliveParticles: TrailParticle[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += deltaTime * 60;

      if (p.life < p.maxLife) {
        // Natural friction and turbulence
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx * config.speed;
        p.y += p.vy * config.speed;

        // Mouse interactions
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < config.interactionRadius) {
          const force = (1 - dist / config.interactionRadius) * config.interactionStrength;
          if (config.mouseInteraction === 'attract') {
            p.vx += (dx / dist) * force * 1.5;
            p.vy += (dy / dist) * force * 1.5;
          } else if (config.mouseInteraction === 'repel') {
            p.vx -= (dx / dist) * force * 2.5;
            p.vy -= (dy / dist) * force * 2.5;
          } else if (config.mouseInteraction === 'swirl') {
            p.vx += (-dy / dist) * force * 2;
            p.vy += (dx / dist) * force * 2;
          }
        }

        // Calculate opacity based on lifespan
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.fillStyle = p.color;
        if (config.glowIntensity > 0.1) {
          ctx.shadowColor = p.color;
        }
        ctx.globalAlpha = p.alpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - (p.life / p.maxLife) * 0.4), 0, Math.PI * 2);
        ctx.fill();

        aliveParticles.push(p);
      }
    }

    this.particles = aliveParticles;
    ctx.restore();
  }
}
