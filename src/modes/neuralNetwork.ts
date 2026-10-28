import { SimulationConfig } from '../types';
import { samplePaletteColor, hexToRgb } from '../lib/colorPalettes';

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;
}

interface SynapsePulse {
  fromNode: number;
  toNode: number;
  progress: number;
  color: string;
}

export class NeuralNetworkEngine {
  private nodes: NeuralNode[] = [];
  private pulses: SynapsePulse[] = [];
  private isInitialized = false;

  public init(width: number, height: number, count: number, colors: string[]) {
    this.nodes = [];
    this.pulses = [];
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2.5 + 2,
        color: samplePaletteColor(colors, Math.random()),
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    this.isInitialized = true;
  }

  public reset(width: number, height: number, count: number, colors: string[]) {
    this.init(width, height, count, colors);
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
    const nodeCount = Math.min(config.particleCount, 250); // Keep reasonable for N^2 distance checks
    if (!this.isInitialized || this.nodes.length !== nodeCount) {
      this.init(width, height, nodeCount, colors);
    }

    // Clear background
    ctx.fillStyle = '#040711';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (config.glowIntensity > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = config.glowIntensity * 12;
    }

    const maxDist = config.neuralDistance || 120;
    const maxDistSq = maxDist * maxDist;

    // Update node positions
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.x += node.vx * config.speed;
      node.y += node.vy * config.speed;
      node.pulsePhase += 0.05 * config.speed;

      // Bounce off walls
      if (node.x < 10) { node.x = 10; node.vx *= -1; }
      if (node.x > width - 10) { node.x = width - 10; node.vx *= -1; }
      if (node.y < 10) { node.y = 10; node.vy *= -1; }
      if (node.y > height - 10) { node.y = height - 10; node.vy *= -1; }

      // Mouse reaction
      const dx = mouse.x - node.x;
      const dy = mouse.y - node.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < config.interactionRadius && d > 0) {
        const force = (1 - d / config.interactionRadius) * config.interactionStrength * (mouse.isDown ? 3 : 1.2);
        if (config.mouseInteraction === 'attract') {
          node.vx += (dx / d) * force * 0.2;
          node.vy += (dy / d) * force * 0.2;
        } else if (config.mouseInteraction === 'repel') {
          node.vx -= (dx / d) * force * 0.4;
          node.vy -= (dy / d) * force * 0.4;
        }
      }

      // Natural drag
      node.vx *= 0.98;
      node.vy *= 0.98;
    }

    // Draw synapses between nearby nodes
    ctx.lineWidth = 1;
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.45;
          const rgb = hexToRgb(n1.color);
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();

          // Chance to trigger an action potential signal pulse
          if (Math.random() < 0.002 * config.speed && this.pulses.length < 50) {
            this.pulses.push({
              fromNode: i,
              toNode: j,
              progress: 0,
              color: n1.color,
            });
          }
        }
      }

      // Connect to mouse as a master hub
      const mdx = mouse.x - n1.x;
      const mdy = mouse.y - n1.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < maxDist * 1.5) {
        const mAlpha = (1 - mDist / (maxDist * 1.5)) * 0.8;
        ctx.strokeStyle = `rgba(0, 240, 255, ${mAlpha})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // Update and draw action potential pulses
    const alivePulses: SynapsePulse[] = [];
    for (const pulse of this.pulses) {
      pulse.progress += 0.03 * config.speed;
      if (pulse.progress < 1) {
        const n1 = this.nodes[pulse.fromNode];
        const n2 = this.nodes[pulse.toNode];
        if (n1 && n2) {
          const px = n1.x + (n2.x - n1.x) * pulse.progress;
          const py = n1.y + (n2.y - n1.y) * pulse.progress;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = pulse.color;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        alivePulses.push(pulse);
      }
    }
    this.pulses = alivePulses;

    // Draw nodes
    for (const node of this.nodes) {
      const pulseSize = node.radius + Math.sin(node.pulsePhase) * 1.2;
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(1, pulseSize), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw active mouse neuron
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
