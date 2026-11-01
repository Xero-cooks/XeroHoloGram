import * as THREE from 'three';
import { HologramAppConfig } from '../config/types';
import { AxisInversionTransformer } from '../optics/axisInversion';

/**
 * HologramStage
 * Encapsulates the WebGL2 / Three.js holographic rendering environment.
 */
export class HologramStage {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private config: HologramAppConfig;
  private axisTransformer: AxisInversionTransformer;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private onRenderCallbacks: Array<(delta: number, elapsed: number) => void> = [];

  constructor(container: HTMLElement, config: HologramAppConfig) {
    this.container = container;
    this.config = config;
    this.clock = new THREE.Clock();
    this.axisTransformer = new AxisInversionTransformer({
      flipX: config.optical.flipX,
      flipY: config.optical.flipY,
    });

    // 1. Scene setup with pure black background for optical transparency
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 2. Camera setup: default eye level perspective looking at origin
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 1.45, 2.6);
    this.camera.lookAt(0, 1.35, 0);

    // 3. Renderer configuration with alpha channel enabled
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 4. Hologram lighting rig
    this.setupLighting();

    // 5. Handle window resizing
    window.addEventListener('resize', this.onResize);

    // 6. Apply axis transforms
    this.applyAxisInversion();
  }

  private setupLighting(): void {
    // Holographic ambient light
    const ambientLight = new THREE.AmbientLight(0x051a2e, 1.2);
    this.scene.add(ambientLight);

    // Key rim light (cyan)
    const keyRim = new THREE.DirectionalLight(0x00e5ff, 2.8);
    keyRim.position.set(0, 3, -2);
    this.scene.add(keyRim);

    // Front fill light (soft violet)
    const fillLight = new THREE.DirectionalLight(0x8a2be2, 1.0);
    fillLight.position.set(1.5, 2, 2.5);
    this.scene.add(fillLight);
  }

  public applyAxisInversion(): void {
    const scale = this.axisTransformer.getProjectionScaleMatrix();
    const scaleMatrix = new THREE.Matrix4().fromArray(scale);
    
    // Scale camera projection for mirror inversion
    this.camera.projectionMatrix.multiply(scaleMatrix);
  }

  public updateConfig(newConfig: HologramAppConfig): void {
    this.config = newConfig;
    this.axisTransformer.setInversion(newConfig.optical.flipX, newConfig.optical.flipY);
    this.onResize();
  }

  public registerRenderHook(callback: (delta: number, elapsed: number) => void): void {
    this.onRenderCallbacks.push(callback);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    for (const callback of this.onRenderCallbacks) {
      callback(delta, elapsed);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.applyAxisInversion();
    this.renderer.setSize(width, height);
  };

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
