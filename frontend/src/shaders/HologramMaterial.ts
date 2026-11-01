import * as THREE from 'three';

export class HologramMaterial extends THREE.ShaderMaterial {
  constructor(colorHex: number = 0x00e5ff) {
    const color = new THREE.Color(colorHex);

    super({
      uniforms: {
        uTime: { value: 0.0 },
        uRimPower: { value: 3.2 },
        uRimColor: { value: new THREE.Color(color) },
        uBaseColor: { value: new THREE.Color(0x020c18) },
        uInnerOpacity: { value: 0.85 },
        uGlitchIntensity: { value: 0.0 },
        uScanlineDensity: { value: 400.0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uGlitchIntensity;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;

          // Glitch displacement on tool execution
          if (uGlitchIntensity > 0.01) {
            float glitch = sin(pos.y * 20.0 + uTime * 40.0) * uGlitchIntensity * 0.03;
            pos.x += glitch;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uRimPower;
        uniform vec3 uRimColor;
        uniform vec3 uBaseColor;
        uniform float uInnerOpacity;
        uniform float uScanlineDensity;
        uniform float uGlitchIntensity;

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float NdotV = max(0.0, dot(normal, viewDir));
          float rim = 1.0 - NdotV;
          float fresnel = pow(rim, uRimPower);

          // CRT scanline pattern
          float scanline = sin((vUv.y + uTime * 0.02) * uScanlineDensity * 3.14159);
          float scanlineFactor = mix(0.82, 1.0, (scanline + 1.0) * 0.5);

          vec3 finalColor = mix(uBaseColor, uRimColor, fresnel) * scanlineFactor;
          float alpha = clamp(fresnel * 1.6 + (1.0 - rim) * uInnerOpacity, 0.0, 1.0);

          // Zero-emission threshold for true black background void
          if (length(finalColor) < 0.015) {
            discard;
          }

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }

  public setGlitch(intensity: number): void {
    this.uniforms.uGlitchIntensity.value = intensity;
  }

  public setRimColor(colorHex: number): void {
    this.uniforms.uRimColor.value.set(colorHex);
  }
}
