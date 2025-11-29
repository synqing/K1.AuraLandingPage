import { commonShaderPartials } from './common';

export const edgeLitShader = {
  vertex: commonShaderPartials.vertex,
  fragment: `
    uniform sampler2D uLedStateBottom;
    uniform sampler2D uLedStateTop;
    uniform float uResolution;
    uniform float uFalloff;
    uniform float uExposure;
    uniform float uSpread;
    uniform float uBaseLevel;
    uniform vec3 uTint;

    varying vec2 vUv;

    ${commonShaderPartials.gaussian}
    ${commonShaderPartials.sampleStrip}

    void main() {
      // 1. Vertical Gradients (Dual Edge-Lit)
      // Bottom Light fades as it goes Up (y -> 1)
      float bottomInfluence = pow(1.0 - vUv.y, uFalloff);

      // Top Light fades as it goes Down (y -> 0)
      float topInfluence = pow(vUv.y, uFalloff);

      // 2. Dynamic Scattering (Blur width increases away from source)
      float bottomSpread = uSpread * (0.2 + vUv.y * 3.0);
      float topSpread = uSpread * (0.2 + (1.0 - vUv.y) * 3.0);

      // 3. Sample both textures
      vec3 colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread, uResolution);
      vec3 colorTop = sampleStrip(uLedStateTop, vUv, topSpread, uResolution);

      // 4. Additive Blending
      vec3 finalColor = (colorBottom * bottomInfluence) + (colorTop * topInfluence);

      // 5. Edge Hotspots (Physical LED Visibility)
      float bottomHotspot = smoothstep(0.02, 0.0, vUv.y);
      float topHotspot = smoothstep(0.98, 1.0, vUv.y);
      float totalHotspot = (bottomHotspot * length(colorBottom)) + (topHotspot * length(colorTop));

      // 6. Final Mix
      vec3 outColor = finalColor + uBaseLevel;
      outColor = outColor * uExposure + (vec3(1.0) * totalHotspot * 4.0);
      outColor *= uTint;

      gl_FragColor = vec4(outColor, 1.0);
    }
  `,
};
