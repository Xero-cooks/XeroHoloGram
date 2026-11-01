/**
 * Interlaced CRT Scanline & Bloom Post-Processing Shader
 * Recreates physical holographic scanlines, beam persistence, and luminance bloom.
 */

export const ScanlineBloomShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uScanlineIntensity: { value: 0.18 },
    uScanlineCount: { value: 480.0 },
    uBloomThreshold: { value: 0.65 },
    uBloomIntensity: { value: 1.2 },
    uResolution: { value: [1920.0, 1080.0] },
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
    uniform float uTime;
    uniform float uScanlineIntensity;
    uniform float uScanlineCount;
    uniform float uBloomThreshold;
    uniform float uBloomIntensity;
    uniform vec2 uResolution;

    varying vec2 vUv;

    void main() {
      vec4 baseColor = texture2D(tDiffuse, vUv);

      // Interlaced scanline modulation with subtle vertical drift
      float scanline = sin((vUv.y + uTime * 0.02) * uScanlineCount * 3.14159);
      scanline = (scanline + 1.0) * 0.5; // [0, 1]
      float scanlineFactor = mix(1.0 - uScanlineIntensity, 1.0, scanline);

      // Bloom extraction based on luminance threshold
      float luminance = dot(baseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 bloom = max(vec3(0.0), baseColor.rgb - vec3(uBloomThreshold)) * uBloomIntensity;

      // Composite scanline and bloom onto base render
      vec3 result = (baseColor.rgb * scanlineFactor) + bloom;

      gl_FragColor = vec4(result, baseColor.a);
    }
  `
};
