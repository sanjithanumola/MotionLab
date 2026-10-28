import { SimulationConfig, GravityBody } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface GravityParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  mass: number;
}

export class GravityPlaygroundEngine {
  private particles: GravityParticle[] = [];
  public bodies: GravityBody[] = [];
  private draggedBodyId: string | null = null;
  private isInitialized = false;

  public init(width: number, height: number, colors: string[]) {
    this.bodies = [
      {
        id: 'central_star',
        x: width * 0.5,
        y: height * 0.5,
        mass: 1400,
        radius: 22,
        color: colors[0] || '#ffd23f',
        isRepulsor: false,
      },
      {
        id: 'planet_1',
        x: width * 0.35,
        y: height * 0.38,
        mass: 550,
        radius: 14,
        color: colors[1] || '#00f0ff',
        isRepulsor: false,
      },
      {
        id: 'repulsor_1',
        x: width * 0.65,
        y: height * 0.62,
        mass: 400,
        radius: 12,
        color: '#ff0055',
        isRepulsor: true,
      },
    ];
    this.spawnParticles(width, height, 800, colors);
    this.isInitialized = true;
  }

  public spawnParticles(width: number, height: number, count: number, colors: string[]) {
    this.particles = [];
    const center = this.bodies[0] || { x: width / 2, y: height / 2 };

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * Math.min(width, height) * 0.45;
      const x = center.x + Math.cos(angle) * dist;
      const y = center.y + Math.sin(angle) * dist;

      // Circular orbital velocity v = sqrt(G * M / r)
      const orbitalSpeed = (Math.sqrt((center.mass || 1000) / dist) * 0.9) * (Math.random() * 0.4 + 0.8);
      const vx = -Math.sin(angle) * orbitalSpeed;
      const vy = Math.cos(angle) * orbitalSpeed;

      this.particles.push({
        x,
        y,
        vx,
        vy,
        color: samplePaletteColor(colors, Math.random()),
        size: Math.random() * 2 + 1,
        mass: 1,
      });
    }
  }

  public addBody(x: number, y: number, isRepulsor: boolean = false, colors: string[]) {
    this.bodies.push({
      id: 'body_' + Date.now(),
      x,
      y,
      mass: isRepulsor ? 600 : 900,
      radius: isRepulsor ? 14 : 18,
      color: isRepulsor ? '#ff0055' : samplePaletteColor(colors, Math.random()),
      isRepulsor,
    });
  }

  public clearAdditionalBodies() {
    if (this.bodies.length > 1) {
      this.bodies = [this.bodies[0]];
    }
  }

  public reset(width: number, height: number, colors: string[]) {
    this.init(width, height, colors);
  }

  public handleMouseDown(x: number, y: number): boolean {
    for (const body of this.bodies) {
      const dx = x - body.x;
      const dy = y - body.y;
      if (Math.sqrt(dx * dx + dy * dy) <= body.radius + 15) {
        this.draggedBodyId = body.id;
        return true;
      }
    }
    return false;
  }

  public handleMouseUp() {
    this.draggedBodyId = null;
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
    if (!this.isInitialized || this.bodies.length === 0) {
      this.init(width, height, colors);
    }

    if (this.particles.length !== config.particleCount) {
      this.spawnParticles(width, height, config.particleCount, colors);
    }

    // Drag body with mouse
    if (this.draggedBodyId) {
      const body = this.bodies.find((b) => b.id === this.draggedBodyId);
      if (body) {
        body.x = mouse.x;
        body.y = mouse.y;
      }
    }

    // Trail persistence fade
    ctx.fillStyle = `rgba(3, 5, 12, ${Math.max(0.03, config.trailFading * 0.7)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 16;
    }

    // Update and draw orbiting particles
    const G = 0.6 * config.speed;
    const dt = Math.min(deltaTime, 0.05) * 60;

    for (const p of this.particles) {
      let fx = 0;
      let fy = 0;

      // Forces from placed celestial bodies
      for (const body of this.bodies) {
        const dx = body.x - p.x;
        const dy = body.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > body.radius) {
          const force = (G * body.mass) / Math.max(distSq, 100);
          const sign = body.isRepulsor ? -1 : 1;
          fx += (dx / dist) * force * sign;
          fy += (dy / dist) * force * sign;
        } else {
          // Inside celestial body - slingshot rebound
          p.vx = -p.vx * 0.7;
          p.vy = -p.vy * 0.7;
        }
      }

      // Cursor gravity well if mouse interaction is active
      if (config.mouseInteraction === 'gravity_well' || (config.mouseInteraction === 'attract' && mouse.isDown)) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10 && dist < 400) {
          const force = (G * 800) / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      p.vx += fx * dt;
      p.vy += fy * dt;

      // Soft speed dampening
      const maxSpeed = 16 * config.speed;
      const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (curSpeed > maxSpeed) {
        p.vx = (p.vx / curSpeed) * maxSpeed;
        p.vy = (p.vy / curSpeed) * maxSpeed;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Screen boundaries wrap
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * config.particleSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw gravity celestial bodies
    for (const body of this.bodies) {
      // Outer gravity field aura
      const grad = ctx.createRadialGradient(body.x, body.y, 0, body.x, body.y, body.radius * 3.5);
      grad.addColorStop(0, body.color);
      grad.addColorStop(0.4, body.isRepulsor ? 'rgba(255, 0, 85, 0.35)' : 'rgba(255, 200, 50, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Solid core
      ctx.fillStyle = body.isRepulsor ? '#ffffff' : body.color;
      ctx.shadowColor = body.color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Label indicator (Attractor / Repulsor)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(body.isRepulsor ? 'REPULSOR (-M)' : 'ATTRACTOR (+M)', body.x, body.y + body.radius + 16);
    }

    ctx.restore();
  }
}
