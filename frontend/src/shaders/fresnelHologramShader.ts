/**
 * Fresnel Hologram Shader
 * Produces physical Pepper's Ghost holographic aesthetics:
 * - Emissive Fresnel rim glow
 * - Zero-alpha pure-black stage occlusion
 * - Dynamic color pulse and holographic depth
 */

export const FresnelHologramShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uRimPower: { value: 3.0 },
    uRimColor: { value: [0.15, 0.85, 1.0] }, // Normalized RGB
    uBaseColor: { value: [0.02, 0.1, 0.18] },
    uInnerOpacity: { value: 0.85 },
    uFlickerIntensity: { value: 0.02 },
  },

  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
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
    uniform float uFlickerIntensity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel rim calculation
      float NdotV = max(0.0, dot(normal, viewDir));
      float rim = 1.0 - NdotV;
      float fresnel = pow(rim, uRimPower);

      // Subtle high-frequency holographic flicker
      float flicker = 1.0 + sin(uTime * 35.0) * uFlickerIntensity;

      // Composite color: base core with vibrant rim emissive glow
      vec3 finalColor = mix(uBaseColor, uRimColor, fresnel) * flicker;
      float alpha = clamp(fresnel * 1.5 + (1.0 - rim) * uInnerOpacity, 0.0, 1.0);

      // Enforce zero-emission threshold for true black background transparency in optical stages
      if (length(finalColor) < 0.01) {
        discard;
      }

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};
