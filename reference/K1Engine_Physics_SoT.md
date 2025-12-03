MODE: EXECUTION

# K1 Engine — Physics Source of Truth (SoT)

## Versioning
- `K1_PHYSICS_VERSION = "K1Physics_v1"`
- Any behavioural change that alters LED outputs (for fixed inputs) must bump this string and update goldens.

---

## ⚠️ CENTER ORIGIN MANDATE (CRITICAL)

**ALL K1 visualizations MUST use Center Origin mode. This is NON-NEGOTIABLE.**

### What This Means:
1. Light MUST be injected at SYMMETRIC positions from center (posLeft AND posRight)
2. `motionMode` MUST always be `'Center Origin'` - NEVER 'Left Origin' or 'Right Origin'
3. The `shiftLeds()` function MUST shift outward from center (left half moves left, right half moves right)

### Correct Injection Pattern:
```typescript
const center = Math.floor(LED_COUNT / 2);  // 80
const displacement = Math.abs(amplitude);
const offset = Math.floor(displacement * (center * 0.9));
const posLeft = Math.max(0, center - offset);
const posRight = Math.min(LED_COUNT - 1, center + offset);
addColor(field, posLeft, r, g, b, intensity);   // LEFT of center
addColor(field, posRight, r, g, b, intensity);  // RIGHT of center
```

### WRONG (Causes Regression):
```typescript
// WRONG: Single point injection
addColor(field, pos, r, g, b, intensity);  // Only one point = no symmetry

// WRONG: Edge injection
addColor(field, 0, r, g, b, intensity);      // Left edge
addColor(field, LED_COUNT - 1, r, g, b, intensity);  // Right edge
```

**Any code that injects light at a single point or at edges is a CENTER ORIGIN VIOLATION.**

---

## Scope
Physics Core maps audio → dual LED strips (bottom/top) as typed arrays/textures. No plate shading, optics, or UI.

## Inputs
- Audio features (live or ghost): envelopes/peaks, optional chroma bands.
- Config params: `simulationSpeed`, `decay`, `motionMode` (MUST BE 'Center Origin'), `ghostAudio`, `hueOffset`, `autoColorShift`, `heroMode`, `heroLoopDuration`, `prismCount/Opacity` (if used in physics), RNG seed (recommended).

## Outputs
- `bottomStrip[0..N-1]`, `topStrip[0..N-1]` (LED_COUNT=160, RGBA floats preferred; Uint8 fallback allowed but must tone-compensate exposure separately).
- Deterministic given same inputs/config/seed.

## Behavioural Guarantees (v1)
- **Motion: `motionMode` MUST be 'Center Origin'** - shifts outward symmetrically from center. Left/Right modes are DEPRECATED and must not be used.
- Triggers: ghost audio produces periodic impulses; hero mode allows scheduled triggers (e.g., at 2s/5s/10s) and resets state each loop to avoid drift.
- Color: hue progression via `hueOffset/autoColorShift`; chroma maps to hue in Snapwave mode; clamped to prevent overflow.
- Decay: multiplicative decay per frame; dynamic fade tied to instantaneous amplitude in Snapwave.
- **Symmetry: Center Origin ALWAYS injects at symmetric positions (center ± offset). Single-point injection is PROHIBITED.**

## Exclusions (must not live in Physics)
- Plate coordinates, falloff, blur, rails, columns, edge hotspots.
- Post-processing (bloom, vignette), UI overlays, compositor concerns.
- Presentation tints unrelated to LED energy.

## Determinism Requirements
- Provide optional RNG seed; when set, outputs for a fixed input/time must match within tolerance.
- For tests, allow fixed timestep or deterministic `dt` to avoid frame-rate drift.

## Test Hooks
- Expose a test mode that:
  - seeds RNG,
  - allows stepping simulation by fixed `dt`,
  - returns raw LED buffers for snapshot comparison.
