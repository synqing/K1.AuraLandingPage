import { commonShaderPartials } from '../../../engine/shaders/common';

export const K1_OPTICS_VERSION = 'K1Optics_v1';

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

    // Optics Mode: 0 = PHYSICAL, 1 = HERO, 2 = EXPERIMENTAL
    uniform float uOpticsMode;

    varying vec2 vUv;

    ${commonShaderPartials.gaussian}
    ${commonShaderPartials.sampleStrip}

    void main() {
      // Branch on optics mode
      if (uOpticsMode < 0.5) {
        // === PHYSICAL: realistic LGP edge-lit diffusion ===
        float bottomSpread = uBottomSpreadNear * (0.2 + vUv.y * 3.0);
        float topSpread = uTopSpreadNear * (0.2 + (1.0 - vUv.y) * 3.0);

        float bottomInfluence = pow(1.0 - vUv.y, uBottomFalloff);
        float topInfluence = pow(vUv.y, uTopFalloff);

        vec3 colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread, uResolution);
        vec3 colorTop = sampleStrip(uLedStateTop, vUv, topSpread, uResolution);

        vec3 finalColor = (colorBottom * bottomInfluence) + (colorTop * topInfluence);

        // Edge hotspots similar to simulator, but mild
        float bottomHotspot = smoothstep(0.02, 0.0, vUv.y);
        float topHotspot = smoothstep(0.98, 1.0, vUv.y);
        float totalHotspot = (bottomHotspot * length(colorBottom)) + (topHotspot * length(colorTop));

        vec3 outColor = finalColor + uBaseLevel;
        outColor = outColor * uExposure + (vec3(1.0) * totalHotspot * 4.0);
        outColor *= uTint;

        gl_FragColor = vec4(outColor, 1.0);
        return;
      }

      // === HERO / EXPERIMENTAL: stylized effects ===

      // --- 1. VERTICAL ATTENUATION (Physical Distance) ---
      float bottomInfluence = pow(1.0 - vUv.y, uBottomFalloff);
      float topInfluence = pow(vUv.y, uTopFalloff);

      // --- 2. LATERAL DIFFUSION (Optical Scattering) ---
      float topSpread = mix(uTopSpreadNear, uTopSpreadFar, 1.0 - vUv.y);
      float bottomSpread = mix(uBottomSpreadNear, uBottomSpreadFar, vUv.y);

      // --- 3. SAMPLE LED BUFFERS ---
      vec3 colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread, uResolution);
      vec3 colorTop = sampleStrip(uLedStateTop, vUv, topSpread, uResolution);

      // --- 4. MID-PLATE COLUMNS ("Waterfalls") ---
      vec3 interaction = colorBottom * colorTop;
      vec3 boostedInteraction = pow(interaction, vec3(uColumnBoostExponent)) * uColumnBoostStrength;
      float midPlateMask = 4.0 * vUv.y * (1.0 - vUv.y);
      vec3 columnEffect = boostedInteraction * midPlateMask;

      // --- 5. EDGE HOTSPOTS (Mechanical Cutouts) ---
      float x = vUv.x;
      float y = vUv.y;

      float distX = min(x, 1.0 - x);
      float edgeX = smoothstep(uEdgeHotspotWidth, 0.0, distX);

      float ySym = abs(y - 0.5);
      float sigmaY = max(uRailSigma, 1e-4);
      float innerLobe = exp(-pow((ySym - uRailInner) / sigmaY, 2.0));
      float outerLobe = exp(-pow((ySym - uRailOuter) / sigmaY, 2.0));
      float railY = max(innerLobe, outerLobe);

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
