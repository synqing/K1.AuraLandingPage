import { commonShaderPartials } from './common';

export const edgeLitShader = {
  vertex: commonShaderPartials.vertex,
  fragment: `
    uniform sampler2D uLedStateBottom;
    uniform sampler2D uLedStateTop;
    uniform float uResolution;
    
    // Global visual params
    uniform float uExposure;
    uniform float uBaseLevel;
    uniform vec3 uTint;

    // Optics: Vertical Falloff
    uniform float uTopFalloff;
    uniform float uBottomFalloff;

    // Optics: Lateral Spread (Blur)
    uniform float uTopSpreadNear;
    uniform float uTopSpreadFar;
    uniform float uBottomSpreadNear;
    uniform float uBottomSpreadFar;

    // Optics: Interaction
    uniform float uColumnBoostStrength;
    uniform float uColumnBoostExponent;

    // Optics: Mechanical
    uniform float uEdgeHotspotStrength;
    uniform float uEdgeHotspotWidth;
    uniform float uRailInner;
    uniform float uRailOuter;
    uniform float uRailSigma;

    varying vec2 vUv;

    ${commonShaderPartials.gaussian}
    ${commonShaderPartials.sampleStrip}

    void main() {
      // --- 1. VERTICAL ATTENUATION (Physical Distance) ---
      // Light decays as it travels through the plate
      float bottomInfluence = pow(1.0 - vUv.y, uBottomFalloff);
      float topInfluence = pow(vUv.y, uTopFalloff);

      // --- 2. LATERAL DIFFUSION (Optical Scattering) ---
      // Top: "Ribs" -> Sharp near source, blurs quickly
      float topSpread = mix(uTopSpreadNear, uTopSpreadFar, 1.0 - vUv.y);
      
      // Bottom: "Footlights" -> Broader, softer domes
      float bottomSpread = mix(uBottomSpreadNear, uBottomSpreadFar, vUv.y);

      // --- 3. SAMPLE LED BUFFERS ---
      vec3 colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread, uResolution);
      vec3 colorTop = sampleStrip(uLedStateTop, vUv, topSpread, uResolution);

      // --- 4. MID-PLATE COLUMNS ("Waterfalls") ---
      // Constructive interference where both top and bottom are active at the same X
      // This simulates the "volumetric column" effect
      vec3 interaction = colorBottom * colorTop;
      
      // Nonlinear boost for the interaction (make columns pop)
      // We use a power function to sharpen the columns
      // Clamp to avoid blowing out
      vec3 boostedInteraction = pow(interaction, vec3(uColumnBoostExponent)) * uColumnBoostStrength;

      // Apply mid-plate mask (strongest in middle, weak at edges)
      // Simple parabolic curve: 1.0 at y=0.5, 0.0 at y=0/1
      float midPlateMask = 4.0 * vUv.y * (1.0 - vUv.y); 
      vec3 columnEffect = boostedInteraction * midPlateMask;

      // --- 5. EDGE HOTSPOTS (Mechanical Cutouts) ---
      // Corner wedge model: horizontal edge × vertical rail lobes
      float x = vUv.x;
      float y = vUv.y;
      
      // Horizontal: near edges strong, center weak
      float distX = min(x, 1.0 - x);
      float edgeX = smoothstep(uEdgeHotspotWidth, 0.0, distX);

      // Vertical: symmetric rail lobes using signed distance from mid-height
      float ySym = abs(y - 0.5);
      float sigmaY = max(uRailSigma, 1e-4);
      float innerLobe = exp(-pow((ySym - uRailInner) / sigmaY, 2.0));
      float outerLobe = exp(-pow((ySym - uRailOuter) / sigmaY, 2.0));
      float railY = max(innerLobe, outerLobe);

      // Final corner mask and boost applied multiplicatively on current colors
      float cornerMask = edgeX * railY;
      vec3 hotspotBoost = (colorBottom + colorTop) * cornerMask * uEdgeHotspotStrength;

      // --- 6. COMPOSITION ---
      vec3 finalColor = (colorBottom * bottomInfluence) + 
                        (colorTop * topInfluence) + 
                        columnEffect +
                        hotspotBoost;

      // --- 7. TONEMAPPING & OUTPUT ---
      vec3 outColor = finalColor + uBaseLevel;
      outColor = outColor * uExposure;
      outColor *= uTint;

      gl_FragColor = vec4(outColor, 1.0);
    }
  `,
};
