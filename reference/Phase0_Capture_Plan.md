MODE: EXECUTION

# Phase 0 — Canonical Scenes & Capture Plan (Baselines)

## Goals
- Freeze today’s visual behaviour for both K1Engine (landing hero) and K1Simulation.
- Produce a minimal set of labeled PNGs we can diff against in future phases.
- Keep captures deterministic: fixed camera, resolution, config, seed.

## Canonical Scenes (Initial Set)
1) **Hero Landing**
   - Engine: `K1Engine` (landing page state).
   - Mode/Preset: `K1_HERO_V1` (once defined), timeline disabled, `heroMode: false`, `mode: Snapwave`, ghost audio on.
   - Camera/Res: 1920×1080, default landing camera.
   - Frames: single frame at ~500 ms after start (or a 1 s clip @60 fps if possible).

2) **Physical Plate (Simulation)**
   - Engine: `K1Simulation` using shared Physics/Optics (post-refactor); interim: current sim with center-origin.
   - Mode/Preset: `K1_PHYSICAL_V1` (once defined), motionMode: Center Origin, ghost audio on, decay/spread defaults.
   - Camera/Res: 1920×1080, orthographic, full-frame LGP.
   - Frames: single frame at ~500 ms.

3) **Diagnostic Bars**
   - Engine: `K1Engine` with diagnostic overlay on.
   - Mode: `diagnosticMode: EDGES_ONLY` (or comparable) to verify edge mapping.
   - Camera/Res: 1920×1080.
   - Frames: single frame at ~500 ms.

Optional additions (later): left-origin/right-origin motion, hero timeline mid-anim, prism/rails experimental.

## Capture Procedure (interim manual)
1. Start app(s) with deterministic seed if available; disable random jitter beyond ghost audio where possible.
2. Set resolution to 1920×1080 (headless or browser window sized accordingly).
3. Navigate to target scene (landing page or simulator) and set the parameters listed above.
4. Allow render to run to ~500 ms; capture canvas to PNG.
5. Save to the structure below with clear names.

## File Layout for Baselines
```
tests/golden/manual/K1Engine/hero/frame_0500.png
tests/golden/manual/K1Simulation/physical/frame_0500.png
tests/golden/manual/K1Engine/diagnostic_edges/frame_0500.png
```

Add a short `README.md` alongside goldens noting:
- scene name, config, resolution, date
- engine build/commit
- seed (if used)

## TODO
- Wire a headless capture script (Phase 3) to automate these.
- Add seedable randomness toggle in engines to remove variance.
