import * as THREE from 'three';
import { SimulationConfig } from '../types';
import { samplePaletteColor } from '../lib/colorPalettes';

export class ThreeUniverseEngine {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private particlesMesh: THREE.Points | null = null;
  private currentGeometryType: string = '';
  private currentParticleCount: number = 0;
  private isInitialized = false;
  private targetRotX = 0;
  private targetRotY = 0;

  public init(canvas: HTMLCanvasElement, width: number, height: number) {
    if (this.isInitialized) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 2000);
    this.camera.position.z = 450;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.isInitialized = true;
  }

  public rebuildGeometry(type: string, count: number, colors: string[]) {
    if (!this.scene) return;

    if (this.particlesMesh) {
      this.scene.remove(this.particlesMesh);
      this.particlesMesh.geometry.dispose();
      (this.particlesMesh.material as THREE.Material).dispose();
      this.particlesMesh = null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0;

      if (type === 'tunnel') {
        const radius = 100 + Math.random() * 80;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = (Math.random() - 0.5) * 1200;
      } else if (type === 'sphere') {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 220 + Math.random() * 30;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else if (type === 'torus') {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const R = 200;
        const r = 70;
        x = (R + r * Math.cos(v)) * Math.cos(u);
        y = (R + r * Math.cos(v)) * Math.sin(u);
        z = r * Math.sin(v);
      } else if (type === 'rings') {
        // Saturn ring system
        if (i < count * 0.3) {
          // Central planet
          const rad = Math.random() * 90;
          const a = Math.random() * Math.PI * 2;
          const b = Math.random() * Math.PI;
          x = rad * Math.sin(b) * Math.cos(a);
          y = rad * Math.sin(b) * Math.sin(a);
          z = rad * Math.cos(b);
        } else {
          // Flat rings
          const rad = 140 + Math.random() * 240;
          const a = Math.random() * Math.PI * 2;
          x = Math.cos(a) * rad;
          y = (Math.random() - 0.5) * 8;
          z = Math.sin(a) * rad;
        }
      } else {
        // Spiral Galaxy (default)
        const arms = 3;
        const armIndex = i % arms;
        const angle = (armIndex * (Math.PI * 2 / arms)) + Math.pow(Math.random(), 1.5) * 5;
        const dist = Math.pow(Math.random(), 1.2) * 320;
        x = Math.cos(angle) * dist + (Math.random() - 0.5) * 35;
        y = (Math.random() - 0.5) * 45;
        z = Math.sin(angle) * dist + (Math.random() - 0.5) * 35;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color from palette
      const hexColor = samplePaletteColor(colors, Math.random());
      const c = new THREE.Color(hexColor);
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Custom glowing point material
    const material = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particlesMesh);

    this.currentGeometryType = type;
    this.currentParticleCount = count;
  }

  public updateAndDraw(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    config: SimulationConfig,
    colors: string[],
    mouse: { x: number; y: number; isDown: boolean },
    deltaTime: number
  ) {
    if (!this.isInitialized) {
      this.init(canvas, width, height);
    }

    if (!this.renderer || !this.scene || !this.camera) return;

    // Check size sync
    if (this.renderer.domElement.width !== width || this.renderer.domElement.height !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    const geomType = config.threeGeometry || 'galaxy';
    const count = Math.min(config.particleCount * 2, 4000);

    if (geomType !== this.currentGeometryType || count !== this.currentParticleCount || !this.particlesMesh) {
      this.rebuildGeometry(geomType, count, colors);
    }

    // Camera perspective rotation driven smoothly by cursor position
    const normX = (mouse.x / width - 0.5) * 2;
    const normY = (mouse.y / height - 0.5) * 2;
    this.targetRotX = normY * 0.9;
    this.targetRotY = normX * 1.2;

    if (this.particlesMesh) {
      this.particlesMesh.rotation.y += 0.005 * config.speed;

      // Animate tunnel particles streaming toward camera
      if (geomType === 'tunnel') {
        const positions = this.particlesMesh.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
          positions[i * 3 + 2] += 6 * config.speed;
          if (positions[i * 3 + 2] > 500) {
            positions[i * 3 + 2] = -700;
          }
        }
        this.particlesMesh.geometry.attributes.position.needsUpdate = true;
      }

      this.particlesMesh.rotation.x += (this.targetRotX - this.particlesMesh.rotation.x) * 0.05;
      this.particlesMesh.rotation.z += (this.targetRotY - this.particlesMesh.rotation.z) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.isInitialized = false;
  }
}
