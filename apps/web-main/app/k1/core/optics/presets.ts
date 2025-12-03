/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    K1 VISUAL PRESETS - CENTER ORIGIN MANDATE               ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  ⚠️  ALL PRESETS MUST HAVE: physics.motionMode = 'Center Origin'  ⚠️      ║
 * ║                                                                           ║
 * ║  When creating new presets:                                               ║
 * ║  1. ALWAYS set physics.motionMode to 'Center Origin'                      ║
 * ║  2. NEVER use 'Left Origin' or 'Right Origin' - they violate the mandate  ║
 * ║  3. Verify the preset produces symmetric light from center                ║
 * ║                                                                           ║
 * ║  PROHIBITED:                                                              ║
 * ║    physics: { motionMode: 'Left Origin' }   ← REGRESSION                  ║
 * ║    physics: { motionMode: 'Right Origin' }  ← REGRESSION                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * K1_PHYSICAL_V1 - Realistic LGP (Light Guide Panel) edge-lit behavior.
 *
 * Matches K1SimulationReference's defaults:
 * - falloff: 1.5
 * - spread: 0.015
 * - exposure: 4.0
 *
 * PHYSICAL mode uses spread formula: bottomSpread = uSpreadNear * (0.2 + vUv.y * 3.0)
 */
export const K1_PHYSICAL_V1 = {
  opticsMode: 'PHYSICAL' as const,
  visuals: {
    exposure: 4.0,
    baseLevel: 0.0,
    tint: '#ffffff',
    hueOffset: 0.0,
    autoColorShift: false,
  },
  optics: {
    // Matched to K1SimulationReference's spread: 0.015
    topSpreadNear: 0.015,
    topSpreadFar: 0.015,
    bottomSpreadNear: 0.015,
    bottomSpreadFar: 0.015,
    // Matched to K1SimulationReference's falloff: 1.5
    topFalloff: 1.5,
    bottomFalloff: 1.5,
    // Disable stylized effects for physical mode
    columnBoostStrength: 0.0,
    columnBoostExponent: 1.0,
    edgeHotspotStrength: 0.0,
    edgeHotspotWidth: 0.02,
    railInner: 0.0,
    railOuter: 0.0,
    railSigma: 1.0,
    prismCount: 0,
    prismOpacity: 0.0,
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICS - CENTER ORIGIN MANDATE: motionMode MUST be 'Center Origin'
  // ═══════════════════════════════════════════════════════════════════════════
  physics: {
    motionMode: 'Center Origin', // ⚠️ MANDATORY - DO NOT CHANGE TO Left/Right Origin
    simulationSpeed: 1.0,
    decay: 0.15,
    ghostAudio: true,
  },
};

/**
 * K1_HERO_V1 - Stylized hero effect for landing page.
 *
 * HERO mode uses stylized features:
 * - Column boost for mid-plate "waterfalls"
 * - Edge hotspots for mechanical cutout look
 * - Rails for structured light distribution
 */
export const K1_HERO_V1 = {
  opticsMode: 'HERO' as const,
  visuals: {
    exposure: 4.0,
    baseLevel: 0.0,
    tint: '#ffffff',
    hueOffset: 0.0,
    autoColorShift: true,
  },
  optics: {
    topSpreadNear: 0.0706,
    topSpreadFar: 0.0539,
    bottomSpreadNear: 0.0706,
    bottomSpreadFar: 0.0539,
    topFalloff: 2.61,
    bottomFalloff: 2.61,
    columnBoostStrength: 0.0,
    columnBoostExponent: 1.2,
    edgeHotspotStrength: 5.0,
    edgeHotspotWidth: 0.1,
    railInner: 0.2,
    railOuter: 0.45,
    railSigma: 1.0,
    prismCount: 0,
    prismOpacity: 0.35,
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICS - CENTER ORIGIN MANDATE: motionMode MUST be 'Center Origin'
  // ═══════════════════════════════════════════════════════════════════════════
  physics: {
    motionMode: 'Center Origin', // ⚠️ MANDATORY - DO NOT CHANGE TO Left/Right Origin
    simulationSpeed: 1.0,
    decay: 0.15,
    ghostAudio: true,
  },
};
