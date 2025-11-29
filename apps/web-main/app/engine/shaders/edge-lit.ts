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
      // --- 1. VERTICAL ATTENUATION (Physical Distance) ---
      // Light decays as it travels through the plate
      float bottomInfluence = pow(1.0 - vUv.y, uFalloff);
      float topInfluence = pow(vUv.y, uFalloff);

      // --- 2. LATERAL DIFFUSION (Optical Scattering) ---
      // Top: "Ribs" -> Sharp near source, blurs quickly
      float topSpread = uSpread * (0.1 + (1.0 - vUv.y) * 2.0);
      
      // Bottom: "Footlights" -> Broader, softer domes
      float bottomSpread = uSpread * (0.3 + vUv.y * 4.0);

      // --- 3. SAMPLE LED BUFFERS ---
      // We use different spread values to create the distinct "Top Ribs" vs "Bottom Domes" look
      vec3 colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread, uResolution);
      vec3 colorTop = sampleStrip(uLedStateTop, vUv, topSpread, uResolution);

      // --- 4. MID-PLATE COLUMNS ("Waterfalls") ---
      // Constructive interference where both top and bottom are active at the same X
      // This simulates the "volumetric column" effect
      vec3 interaction = colorBottom * colorTop;
      float interactionStrength = length(interaction);
      // Boost columns in the middle of the plate
      float midPlateMask = smoothstep(0.2, 0.5, vUv.y) * smoothstep(0.8, 0.5, vUv.y);
      vec3 columnBoost = interaction * midPlateMask * 4.0; // Arbitrary boost factor

      // --- 5. EDGE HOTSPOTS (Mechanical Cutouts) ---
      // Boost brightness at the very edges of the unit
      float edgeMask = smoothstep(0.02, 0.0, vUv.x) + smoothstep(0.98, 1.0, vUv.x);
      vec3 hotspotBoost = (colorBottom + colorTop) * edgeMask * 2.0;

      // --- 6. COMPOSITION ---
      vec3 finalColor = (colorBottom * bottomInfluence) + 
                        (colorTop * topInfluence) + 
                        columnBoost +
                        hotspotBoost;

      // --- 7. TONEMAPPING & OUTPUT ---
      vec3 outColor = finalColor + uBaseLevel;
      outColor = outColor * uExposure;
      outColor *= uTint;

      gl_FragColor = vec4(outColor, 1.0);
    }
  `,
};
