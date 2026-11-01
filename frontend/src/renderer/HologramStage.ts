import * as THREE from 'three';
import { HologramAppConfig } from '../config/types';
import { AxisInversionTransformer } from '../optics/axisInversion';

/**
 * HologramStage
 * Encapsulates the WebGL2 / Three.js holographic rendering environment.
 * Features high-brightness IPS panel display contrast boost, ACES Filmic tone mapping,
 * absolute #000000 optical black void, and seamless Fullscreen Projection Mode.
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

  // Lighting References for Dynamic IPS Boost
  private ambientLight!: THREE.AmbientLight;
  private keyRimLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private topSpotLight!: THREE.DirectionalLight;

  constructor(container: HTMLElement, config: HologramAppConfig) {
    this.container = container;
    this.config = config;
    this.clock = new THREE.Clock();
    this.axisTransformer = new AxisInversionTransformer({
      flipX: config.optical.flipX,
      flipY: config.optical.flipY,
    });

    // 1. Scene setup with pure #000000 black background for optical Pepper's Ghost transparency
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 2. Camera setup: default eye level perspective looking at origin
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 1.45, 2.6);
    this.camera.lookAt(0, 1.35, 0);

    // 3. Renderer configuration with alpha channel & ACES Filmic Tone Mapping for IPS vibrancy
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 1.0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Enhanced initial exposure for vivid contrast
    this.container.appendChild(this.renderer.domElement);

    // 4. High-Intensity Hologram Lighting Rig
    this.setupLighting();

    // 5. Window resizing
    window.addEventListener('resize', this.onResize);

    // 6. Apply axis transforms
    this.applyAxisInversion();
  }

  private setupLighting(): void {
    // Subtle deep blue ambient base (keeps blacks pitch dark)
    this.ambientLight = new THREE.AmbientLight(0x020d1c, 0.8);
    this.scene.add(this.ambientLight);

    // High-Intensity Key Rim Light (Electric Cyan)
    this.keyRimLight = new THREE.DirectionalLight(0x00f0ff, 4.2);
    this.keyRimLight.position.set(0, 3.2, -2.5);
    this.scene.add(this.keyRimLight);

    // Secondary Fill Rim Light (Cyber Violet)
    this.fillLight = new THREE.DirectionalLight(0x8b5cf6, 2.0);
    this.fillLight.position.set(2.0, 2.2, 2.8);
    this.scene.add(this.fillLight);

    // Top Downward Quantum Spot Light (Illuminates head, visor & reactor core)
    this.topSpotLight = new THREE.DirectionalLight(0xffffff, 2.6);
    this.topSpotLight.position.set(0, 4.0, 0.5);
    this.scene.add(this.topSpotLight);
  }

  /**
   * IPS Display Calibration & Max Brightness Boost
   * Counters IPS backlight glow by boosting edge luminescence and tone mapping
   */
  public setIPSOptimization(enabled: boolean, exposure: number = 1.45): void {
    this.renderer.toneMappingExposure = enabled ? exposure : 1.0;
    if (this.keyRimLight) this.keyRimLight.intensity = enabled ? 4.8 : 2.8;
    if (this.fillLight) this.fillLight.intensity = enabled ? 2.4 : 1.2;
    if (this.topSpotLight) this.topSpotLight.intensity = enabled ? 3.2 : 1.6;
    if (this.ambientLight) this.ambientLight.intensity = enabled ? 0.6 : 0.8; // Lower ambient keeps blacks deep
  }

  /**
   * Toggle Fullscreen Hologram Projection Mode
   */
  public async toggleFullscreen(force?: boolean): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const isFs = !!document.fullscreenElement;
    const target = force !== undefined ? force : !isFs;

    try {
      if (target && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        return true;
      } else if (!target && document.fullscreenElement) {
        await document.exitFullscreen();
        return false;
      }
    } catch (e) {
      console.warn('[HologramStage] Fullscreen request error:', e);
    }
    return !!document.fullscreenElement;
  }

  public applyAxisInversion(): void {
    const scale = this.axisTransformer.getProjectionScaleMatrix();
    const scaleMatrix = new THREE.Matrix4().fromArray(scale);
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
