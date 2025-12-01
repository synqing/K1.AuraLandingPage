Yeah, fair. This thread has turned into a spaghetti bowl. Let’s freeze it into one clean “load this into a fresh agent” prompt.

Here’s a **self-contained contextualisation prompt** you can paste into a new chat / TRAE agent / whatever. It assumes nothing and gives the next agent marching orders.

---

## K1 Lightwave — Visual Engine Context Prompt (for new coding agent)

You are taking over work on the **K1 Lightwave** visual engine.

### 0. What K1 is (product reality)

- K1 is a **dual-edge-lit light bar** that uses the **film stack from an LCD backlight (diffusers + prism films + tuned air gaps)** instead of a PMMA light guide.
- There are **two LED rails**:
  - Top and bottom, same length (currently 160 pixels).
  - They feed light into the film stack, which produces:
    - sharp top beams,
    - softer bottom footlights,
    - a foggy column where they collide,
    - spicy edge hotspots.

- The **design intent**:
  Top & bottom rails are **optically symmetric**. Any differences in a given prototype (film cut tolerances, bowing, etc.) are treated as noise, not spec.

Your job is to bring the **browser simulator** in line with that design intent and make it **stable, symmetric, and deterministic**.

---

## 1. Repo & core files

Repo: **`synqing/K1.AuraLandingPage`**

The visual engine lives under:

- `apps/web-main/app/engine/K1Engine.tsx`
- `apps/web-main/app/engine/useK1Physics.ts`
- `apps/web-main/app/engine/edge-lit.ts` (GLSL shader + material)
- `apps/web-main/app/engine/VisualLayer.tsx`
- `apps/web-main/app/engine/Compositor.tsx`
- `apps/web-main/app/engine/useTimelineController.ts`
- `apps/web-main/app/engine/sequence.ts`
- `apps/web-main/app/engine/DebugOverlay.tsx`

There is also an older sandboxed sim:

- `apps/web-main/app/simulator/K1Simulation.tsx`

That older sim is **not** the main path; treat it as reference only.

---

## 2. Current architecture (high level)

### `K1Engine.tsx`

- Manages Leva controls:
  - **Timeline**: `timelineEnabled`, `loop`, `timelineTime`.
  - **Visuals**: `exposure`, `baseLevel`, `tint`.
  - **Optics**: spread/falloff/edge params.
  - **Physics**: `motionMode`, `simulationSpeed`, `decay`, `ghostAudio`.
  - **Diagnostics**: `diagnosticMode`, `showDebugOverlay`.

- Loads `K1_HERO_PRESET` with default values.
- Calls:
  - `useTimelineController` to blend manual vs timeline-driven params.
  - `useK1Physics` to get `texTop`, `texBottom`, `ledCount`.

- Builds uniform bundle for the edge-lit shader and passes it to `VisualLayer` and `Compositor`.
- Optionally renders `DebugOverlay` to show raw 1D LED buffers.

### `useK1Physics.ts` (NEW kernel)

- Maintains **one canonical 1D LED field**:
  - `field: Float32Array(LED_COUNT * 4)`

- Has two working buffers:
  - `topBuf`, `bottomBuf`.

- Behaviour:
  1. **Diagnostics override**
     - Modes: `NONE`, `TOP_ONLY`, `BOTTOM_ONLY`, `COLLISION`, `EDGES_ONLY`.
     - When `diagnosticMode !== 'NONE'`:
       - Clear `field`.
       - Write the appropriate impulses (centre / edges).
       - Build `bottomBuf = field`.
       - Build `topBuf` as a **horizontal mirror** of `field`.
       - Upload both textures and **return early**.
         (No ghostAudio, no decay, no motion, no noise.)

  2. **Normal physics path** (`diagnosticMode === 'NONE'`):
     - `ghostAudio` currently uses simple **deterministic oscillators** (no real audio yet).
     - **Single decay** applied to the entire field.
     - **Symmetric advection**:
       - `Center Origin` → outward from centre.
       - `Left Origin` → shift right.
       - `Right Origin` → shift left.

     - **Single injection**:
       - A hue-cycled impulse injected at:
         - centre, or
         - index 0 (left), or
         - index N-1 (right) depending on `motionMode`.

     - After physics:
       - `bottomBuf = field` (direct).
       - `topBuf` = mirror of `field` across the horizontal axis.
       - Upload to `texBottom` and `texTop`.

**Key point:** the current kernel is **symmetric by construction**: there is no per-channel decay/advection/injection anymore. Any asymmetry now comes from the **optics layer and presets**, not the physics.

### `edge-lit.ts`

- Custom fragment shader approximates the film-stack optics:
  - Horizontal blur of the 1D strip (Gaussian-like) with `topSpreadNear/Far` and `bottomSpreadNear/Far`.
  - Vertical attenuation with `topFalloff` / `bottomFalloff`.
  - Optional “column boost” for collisions.
  - Edge hotspot controls.

- Shader has already been patched once so that:
  - UV sampling near x=0/1 is **clamped**, not skipped,
  - kernel weights are renormalised to avoid hard cliffs at edges.

You should still audit it, but the worst edge-cliff issue was already addressed.

---

## 3. Status: what’s working vs what’s broken

### Working / mostly OK

- **Diagnostics exclusivity**:
  - TOP_ONLY, BOTTOM_ONLY, COLLISION, EDGES_ONLY now produce static, symmetric buffers and plate patterns when `timelineEnabled = false` and `ghostAudio = false`.

- **Symmetric physics kernel**:
  - Single field, mirrored top/bottom.
  - One decay, one advection path, one injection.

- **Timeline system**:
  - Exists and runs; not the current focus.

### Broken / user complaints

1. **Optics preset drift / asymmetry**
   - `K1_HERO_PRESET.optics` has been overwritten a few times.
   - At various points the optics were:
     - calibrated & symmetric (design intent), then
     - reverted to older, asymmetric values (top vs bottom spreads & falloffs differ).

   - Leva ranges for spreads were too low (`max=0.02/0.05`), silently clamping calibrated values like `0.0706` down to `0.02`.
   - Result: even with symmetric physics, **top-only vs bottom-only beams look like different species**.

2. **Visual behaviour feels unstable / random**
   - The user sees the engine “drifting from one random state to another” when timeline/ghostAudio are on.
   - Likely causes:
     - ghostAudio oscillators + decay + timeline param automation = complex attractor, not obviously musical.
     - No explicit reset / repeatable pattern for the hero demo.

   - Important: this is **not** a crash; it’s behaviour that feels non-deterministic / unmusical to the user.

3. **Overall: still doesn’t feel like the real K1**
   - Edges now look closer; core beam shapes are getting there.
   - But motion + colour still don’t match the bench unit’s “personality”.

---

## 4. What the next agent should do

Your job is to **stabilise and de-randomise the sim**, starting at fundamentals, _not_ pile on new complexity.

### Step 1 – Lock in symmetric optics (non-negotiable)

- In `K1Engine.tsx`, inspect `K1_HERO_PRESET.optics`.

- Replace any asymmetric values with a **symmetric, design-intent block** (e.g. from the last calibration):

  ```ts
  optics: {
    topSpreadNear:    0.0706,
    topSpreadFar:     0.0539,
    bottomSpreadNear: 0.0706,
    bottomSpreadFar:  0.0539,
    topFalloff:    2.61,
    bottomFalloff: 2.61,
    columnBoostStrength: 0.0,
    columnBoostExponent: 1.2,
    edgeHotspotStrength: 5.0,
    edgeHotspotWidth: 0.10,
  }
  ```

- Ensure Leva “Optics” controls have:
  - `max >= 0.12` for all spreads,
  - sensible ranges for falloff, boost, edges.

- Confirm that on load, Leva shows the symmetric values, not clamped ones.

**Acceptance:**

In TOP_ONLY and BOTTOM_ONLY diag modes (timeline off, ghostAudio off):

- Top and bottom beams should be **visually identical**, just flipped vertically.
- Edges-only mode: left/right corners should match.

If they don’t, _fix this before anything else_ (either in presets or shader).

### Step 2 – Make the hero behaviour deterministic (stop the “random drift”)

Right now:

- ghostAudio uses oscillators,
- decay + advection + timeline can push the field into weird states.

You must:

- Design a **simple, repeatable hero “loop”** that behaves the same every time.

Concrete suggestions:

- For hero mode, ignore real audio for now:
  - Use a fixed sequence of triggers (e.g., `sequence.ts`), not open-ended oscillators.
  - Ensure `field` is reset or naturally decays back to zero between loops.

- Consider adding a `physicsMode` or `heroMode` flag so:
  - Diagnostics are unaffected,
  - Hero sim uses a specific, curated pattern sequence (e.g. run by `sequence.ts` and `useTimelineController`),
  - Free-form ghostAudio mode stays separate for future experimentation.

**Goal:** when the user loads the page and leaves it alone, the sim should:

- run a **finite, looping sequence**, not wander.

### Step 3 – Audit edge-lit shader colour handling (optional but important)

The user has also complained that:

- Bloom is nice,
- but colour mapping feels wrong.

Likely issues in `edge-lit.ts`:

- LED RGB sampled then collapsed to luma, then tinted globally.
- We want per-pixel **colour** from `texTop/texBottom` to survive through the kernel.

Your task here:

- Ensure shader does something like:

  ```glsl
  vec3 topRGB    = texture(uLedStateTop,    vec2(uTop, 0.5)).rgb;
  vec3 bottomRGB = texture(uLedStateBottom, vec2(uBot, 0.5)).rgb;

  vec3 mixed = topRGB * topInfluence + bottomRGB * bottomInfluence;
  mixed *= uTint; // optional grading

  gl_FragColor = vec4(mixed, 1.0);
  ```

- Not “convert to grayscale then tint”.

Colour can be refined later, but the basics should not destroy per-channel hue.

### Step 4 – Don’t introduce new asymmetry silently

If you add any new modes:

- make them explicit (`physicsMode`, `opticsMode`, `colourMode`),
- default should remain **symmetric, deterministic** behaviour,
- diagnostics must always remain symmetric, static, and exclusive.

---

## 5. Interaction principles

The user (Captain) is:

- Extremely sensitive to **fundamentals** being wrong (and rightfully so),
- Tired of fighting silent clamps, half-fixes, and regressions,
- Okay with motion/colour being “not finished yet” **as long as** the base is sound and predictable.

So:

- Be explicit in your commits and comments:
  - what changed,
  - why,
  - how to verify.

- Always check:
  - `timelineEnabled = false`,
  - `diagnosticMode` sweeps,
  - DebugOverlay symmetry,
    before calling something “done”.

---

That’s the state of play.

You have a working symmetric physics kernel; your main tasks are to lock the optics into that symmetry, remove drift from the hero behaviour, and ensure the shader/engine combo isn’t quietly undoing all that work.
