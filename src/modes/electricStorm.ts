import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

interface TeslaNode {
  id: string;
  x: number;
  y: number;
  charge: number;
  radius: number;
}

interface ElectricSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export class ElectricStormEngine {
  private nodes: TeslaNode[] = [];
  private sparks: ElectricSpark[] = [];
  private draggedNodeId: string | null = null;
  private isInitialized = false;

  public init(width: number, height: number) {
    this.nodes = [
      { id: 'node_1', x: width * 0.2, y: height * 0.3, charge: 1, radius: 18 },
      { id: 'node_2', x: width * 0.8, y: height * 0.25, charge: 1, radius: 18 },
      { id: 'node_3', x: width * 0.5, y: height * 0.78, charge: 1, radius: 22 },
      { id: 'node_4', x: width * 0.25, y: height * 0.75, charge: 1, radius: 16 },
      { id: 'node_5', x: width * 0.75, y: height * 0.75, charge: 1, radius: 16 },
    ];
    this.isInitialized = true;
  }

  public reset(width: number, height: number) {
    this.init(width, height);
    this.sparks = [];
  }

  public handleMouseDown(x: number, y: number): boolean {
    for (const n of this.nodes) {
      const d = Math.hypot(x - n.x, y - n.y);
      if (d <= n.radius + 15) {
        this.draggedNodeId = n.id;
        return true;
      }
    }
    return false;
  }

  public handleMouseUp() {
    this.draggedNodeId = null;
  }

  private drawLightningBolt(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number,
    color: string,
    width: number,
    depth: number = 0
  ) {
    if (displace < 4 || depth > 5) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }

    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;

    this.drawLightningBolt(ctx, x1, y1, midX, midY, displace / 2, color, width, depth + 1);
    this.drawLightningBolt(ctx, midX, midY, x2, y2, displace / 2, color, width, depth + 1);

    // Branch off randomly
    if (Math.random() < 0.25 && depth < 3) {
      const branchAngle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.2;
      const branchLen = Math.hypot(x2 - x1, y2 - y1) * 0.45;
      const bx = midX + Math.cos(branchAngle) * branchLen;
      const by = midY + Math.sin(branchAngle) * branchLen;
      this.drawLightningBolt(ctx, midX, midY, bx, by, displace / 2.2, color, width * 0.6, depth + 2);
    }
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
    if (!this.isInitialized) {
      this.init(width, height);
    }

    if (this.draggedNodeId) {
      const n = this.nodes.find((item) => item.id === this.draggedNodeId);
      if (n) {
        n.x = mouse.x;
        n.y = mouse.y;
      }
    }

    // Canvas background with fast dissipation for electrical flashes
    ctx.fillStyle = `rgba(3, 5, 14, ${Math.max(0.18, config.trailFading * 1.5)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 22;
    }

    const primaryColor = colors[0] || '#00f0ff';
    const secondaryColor = colors[1] || '#ff007b';

    // Draw electrical discharges from mouse to closest Tesla nodes
    for (const node of this.nodes) {
      const dist = Math.hypot(mouse.x - node.x, mouse.y - node.y);
      const isClose = dist < (config.interactionRadius * 1.6);

      if (isClose || mouse.isDown) {
        // Strike!
        const boltCount = mouse.isDown ? 3 : 1;
        for (let b = 0; b < boltCount; b++) {
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = primaryColor;
          ctx.lineWidth = mouse.isDown ? 3 : 2;
          this.drawLightningBolt(ctx, mouse.x, mouse.y, node.x, node.y, dist * 0.35, primaryColor, 2.5);

          // Spawn contact sparks
          if (this.sparks.length < 200) {
            for (let s = 0; s < 3; s++) {
              const ang = Math.random() * Math.PI * 2;
              this.sparks.push({
                x: node.x,
                y: node.y,
                vx: Math.cos(ang) * (Math.random() * 5 + 1),
                vy: Math.sin(ang) * (Math.random() * 5 + 1),
                color: samplePaletteColor(colors, Math.random()),
                life: 0,
                maxLife: 20 + Math.random() * 20,
              });
            }
          }
        }
      }

      // Mutual arcing between adjacent nodes
      for (const other of this.nodes) {
        if (node.id !== other.id) {
          const mutualDist = Math.hypot(other.x - node.x, other.y - node.y);
          if (mutualDist < 260 && Math.random() < 0.15 * config.speed) {
            ctx.strokeStyle = secondaryColor;
            ctx.shadowColor = secondaryColor;
            ctx.lineWidth = 1.2;
            this.drawLightningBolt(ctx, node.x, node.y, other.x, other.y, mutualDist * 0.25, secondaryColor, 1.2);
          }
        }
      }

      // Draw Tesla coil coil node
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, primaryColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw active cursor discharge emitter
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Update and draw sparks
    const aliveSparks: ElectricSpark[] = [];
    for (const sp of this.sparks) {
      sp.life += deltaTime * 60;
      if (sp.life < sp.maxLife) {
        sp.x += sp.vx * config.speed;
        sp.y += sp.vy * config.speed;
        sp.vx *= 0.94;
        sp.vy *= 0.94;

        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, 1 - sp.life / sp.maxLife);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        aliveSparks.push(sp);
      }
    }
    this.sparks = aliveSparks;

    ctx.restore();
  }
}
