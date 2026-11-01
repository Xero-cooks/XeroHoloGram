/**
 * Holographic Chromatic Aberration Shader
 * Simulates optical prism wavelength dispersion at glass boundaries.
 */

export const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uDistortion: { value: 0.004 },
    uCenter: { value: [0.5, 0.5] },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uDistortion;
    uniform vec2 uCenter;

    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - uCenter;
      float dist = length(dir);
      vec2 offset = dir * dist * uDistortion;

      // Sample red, green, and blue channels with radial shift
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;

      gl_FragColor = vec4(r, g, b, a);
    }
  `
};
