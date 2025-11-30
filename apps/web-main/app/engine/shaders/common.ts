export const commonShaderPartials = {
  vertex: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  gaussian: `
    float gaussian(float x, float sigma) {
      return exp(-(x * x) / (2.0 * sigma * sigma));
    }
  `,

  sampleStrip: `
    vec3 sampleStrip(sampler2D strip, vec2 uv, float spreadBase, float resolution) {
      vec3 accumulatedColor = vec3(0.0);
      float totalWeight = 0.0;
      float samples = 7.0;
      float pixelWidth = 1.0 / resolution;
      float currentSigma = spreadBase;

      for(float i = -samples; i <= samples; i++) {
        float offset = i * pixelWidth;
        float weight = gaussian(offset, currentSigma);
        
        // Fix: Clamp UVs to valid range [0, 1] instead of skipping or wrapping
        // This prevents hard cutoffs at the texture edges
        vec2 sampleUv = vec2(clamp(uv.x + offset, 0.0, 1.0), 0.5);
        
        accumulatedColor += texture2D(strip, sampleUv).rgb * weight;
        totalWeight += weight;
      }
      
      // Normalize by the actual accumulated weight
      return accumulatedColor / max(totalWeight, 1e-5);
    }
  `,
};
