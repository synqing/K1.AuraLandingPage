MODE: EXECUTION

# K1 Engine — Optics Source of Truth (SoT)

## Versioning
- `K1_OPTICS_VERSION = "K1Optics_v1"`
- Core presets:
  - `K1_PHYSICAL_V1`
  - `K1_HERO_V1`
- Behavioural changes to plate shading require version bump and golden refresh.

## Scope
Optics Core maps LED strips (physics output) → 2D plate colour. No audio logic. No presentation/post-effects.

## Inputs
- `bottomStrip`, `topStrip` textures (ideally Float32; Uint8 fallback supported).
- Optics params: spread (top/bottom near/far), falloff (top/bottom), tint, exposure/baseLevel, edge hotspot strength/width, column boost strength/exponent, rail lobes (inner/outer/sigma), prism count/opacity (if used), opticsMode (`PHYSICAL | HERO | EXPERIMENTAL`).
- Resolution/uniforms: LED count, plate UVs.

## Outputs
- Fragment shader output (RGBA) representing plate colour before any presentation/post.
- Must be stable for same inputs/configs.

## Behavioural Expectations (v1)
- **Physical mode (`K1_PHYSICAL_V1`):**
  - Gaussian-like lateral diffusion of each strip into plate.
  - Vertical falloff from edge to mid-plate; mid-plate brightness ≈ 30–40% of edge.
  - Minimal hotspots/columns/rails; symmetry top/bottom unless explicitly asymmetric.
  - No vignette/bloom; pure diffusion.
- **Hero mode (`K1_HERO_V1`):**
  - Builds on Physical with mild enhancements: slight edge hotspot, mild column emphasis, optional tint/hue shift.
  - Remains physically plausible (no neon abstraction).
- Experimental optics/features must be gated behind `EXPERIMENTAL` and not used as defaults.

## Exclusions (must not live in Optics)
- Audio feature handling, triggers, motion logic (physics domain).
- Presentation/post: bloom, vignette, ghost overlays, UI rails separate from physical rails.
- Canvas/compositor management (presentation domain).

## Test Hooks
- Deterministic shader inputs: expose uniforms for all optics params; avoid hidden time-based variation.
- For visual regression: render single frames at fixed params/time; compare to goldens.

## Naming/Usage Rules
- Default landing/simulator presets must point to production modes (`PHYSICAL`/`HERO`), not `EXPERIMENTAL`.
- Promotion from experimental → production requires SoT update, version bump, golden refresh.
