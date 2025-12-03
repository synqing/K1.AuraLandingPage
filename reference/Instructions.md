## 1. Phased implementation plan (anti-Frankenstein roadmap)

### Phase 0 – Capture current behaviour (freeze the monster)

**Goal:** Freeze what “good enough right now” looks like before we touch anything.

**Tasks:**

- Choose **3–5 canonical scenes**:
  - e.g. “Physical realistic plate”, “Hero landing page hero shot”, “Diagnostic mode view”.

- For each scene:
  - Fix camera + resolution (e.g. 1920×1080).
  - Fix engine config (preset, physics params, heroMode flag).
  - Capture a **short PNG frame sequence** from both:
    - `K1Engine` (what’s on the landing page)
    - `K1Simulation` (the more realistic one)

- Store them in repo under something like:
  - `tests/golden/manual/K1Engine/…`
  - `tests/golden/manual/K1Simulation/…`

**Why:** This gives us human-visible references before we add automated tests. Visual regression approaches are literally built on this idea: baseline screenshots compared pixel-by-pixel against new ones to detect unintended changes.

**Done when:**

- You have a small folder of labelled PNGs and a one-pager noting:
  - Scene name
  - Engine configuration used
  - Why you care about that scene (e.g. “Hero: landing page look”, “Physical: should resemble real hardware”).

---

### Phase 1 – Define the Source-of-Truth (SoT) docs

**Goal:** Explicitly define what’s “core truth” vs “styling”.

You create two short docs (1–2 pages each):

1. `K1Engine_Physics_SoT.md`
   - Defines **Physics Core**:
     - Input: audio stream → time-bucketed features (bands, envelopes, chroma, etc.).
     - Output: 2 strips of LED data:
       - `bottomStrip[0..N-1]`, `topStrip[0..N-1]` as RGB/float textures.

     - Behavioural guarantees:
       - Same audio & config → same LED sequences (within tolerance).
       - No plate shading, no bloom, no rails in this layer. Pure LEDs.

2. `K1Engine_Optics_SoT.md`
   - Defines **Optics Core**:
     - Input: LED textures from Physics Core.
     - Output: 2D plate colour.
     - `K1_PHYSICAL_V1`:
       - Roughly Gaussian blur of edge strips into the plate.
       - Mid-plate brightness ≈ 30–40% of edge, smooth falloff, no banding.
       - Symmetric behaviour for top/bottom unless explicitly asymmetric.

     - `K1_HERO_V1`:
       - Same underlying blur, but allowed:
         - Slightly stronger edge hotspots,
         - Mild column emphasis,
         - Tint / hue shift – but still “physically plausible”.

Also define **Presentation Layer** explicitly:

- Everything “beyond photons in plastic”:
  - Rails that look like UI strips, lens flares, bloom, ghost overlays, etc.

This matches how people do golden/approval tests in practice: you define “intended behaviour” in docs, then lock it with snapshot tests.

**Done when:**

- Those two docs exist and have:
  - Named versions (`K1_PHYSICAL_V1`, `K1_HERO_V1`).
  - Clear statements like “Physics must not contain plate shading logic”.

---

### Phase 2 – Enforce Physics / Optics / Presentation separation

**Goal:** Make “what can break” extremely localised.

**Code tasks for Codex:**

1. **Create a clear folder structure:**

```text
src/k1/core/
  physics/
    useK1Physics.ts      // or existing file
  optics/
    edgeLitShader.ts
    presets.ts           // K1_PHYSICAL_V1, K1_HERO_V1 etc.
  presentation/
    layers/
    compositor/
```

2. **Physics Core:**
   - Ensure `useK1Physics` (or equivalent) is **purely about LEDs**:
     - No 2D plate coordinates.
     - No rail calculations.
     - No optical falloffs; only LED brightness, colour, motion.

   - Version it internally:
     - `physicsVersion = 'K1Physics_v1'` as a constant.

3. **Optics Core:**
   - Move `edgeLitShader` into `optics/edgeLitShader.ts`.
   - Create an explicit **“physical” mode** that emulates the current K1Simulation look:
     - Single main blur kernel along X applied to each strip.
     - Vertical blending from edges into plate.
     - One or two parameters that roughly correspond to “spread” and “falloff”.

   - Keep more stylised controls (rails, column boosts, prism shaping) behind clearly named params:
     - `opticsMode: 'PHYSICAL' | 'HERO' | 'EXPERIMENTAL'`.

4. **Presentation:**
   - Anything that is clearly visual “flare”:
     - Glow passes,
     - Ghost overlays,
     - Extra gradients,
     - Rails drawn as separate passes

   - Lives under `presentation/`.

5. **Wire `K1Engine` to use these layers explicitly:**
   - `K1Engine` should:
     - Call `useK1Physics` for LED data.
     - Feed those into `edgeLitShader` as the only plate shader in core.
     - Stack Presentation layers via the compositor.

**Done when:**

- You can point to one file and say:
  - “Here is physics; no optics in it.”
  - “Here is optics; no audio or UI logic in it.”
  - “Here is presentation; I can delete this folder and still have a correct physical plate.”

---

### Phase 3 – Turn “physical” into golden-master tests

**Goal:** Turn visual sanity into **automated** sanity.

Visual regression / snapshot testing for canvas/WebGL is a solved pattern in the wild:

- Render frames off-screen, capture images, compare to a baseline image; fail if diff > threshold.

**Tasks:**

1. **Choose your baseline cases:**
   - Start with 2–3 scenarios:
     - `K1_PHYSICAL_V1` – static gradients and simple beat pattern.
     - `K1_HERO_V1` – the landing page hero setup.
     - Optional: diagnostic mode (to ensure you don’t break your “lab” view).

2. **Create a test harness (Node or headless browser):**
   - Use something like:
     - Playwright / Puppeteer to load your React app in a headless browser, or
     - A minimal WebGL/canvas runner (similar to luma.gl’s SnapshotTestRunner approach).

   - For each test:
     - Spin an off-screen canvas.
     - Initialise K1Engine in a special “test” mode:
       - No UI, deterministic seeded randomness.

     - Let it render to a stable frame (e.g. at t = 500 ms).
     - Capture the canvas as PNG (via `toDataURL` or equivalent).

3. **Store baseline (“golden”) images:**
   - `tests/golden/K1_PHYSICAL_V1/frame_0500.png`
   - `tests/golden/K1_HERO_V1/frame_0500.png`

4. **Compare during tests:**
   - Use an image diff library (pixel-wise or SSIM) to compare test output with golden:
     - Many visual regression setups do simple pixel diffs plus tolerance.

   - If difference > threshold:
     - Test fails and writes out a `*_diff.png` for human inspection.

5. **Integrate with your CI:**
   - Add a `yarn test:visual` step.
   - Run it in GitHub Actions only on relevant branches (e.g. `main`, `engine-*`).

**Done when:**

- A shader/physics change that substantially alters the physical or hero look **breaks CI** unless you update the golden images _on purpose_.

---

### Phase 4 – Experimental vs Production tracks

**Goal:** Experiments stay fun without contaminating the core.

**Tasks:**

1. **Naming convention:**
   - Production presets:
     - `K1_PHYSICAL_V1`, `K1_HERO_V1`, `K1_PHYSICAL_V2`, etc.

   - Experimental presets:
     - `K1_HERO_EXPERIMENTAL_RAILS_01`, etc.

   - Production optics modes:
     - `'PHYSICAL' | 'HERO'`

   - Experimental optics mode:
     - `'EXPERIMENTAL'` (never the default).

2. **Folder layout:**

```text
src/k1/experiments/
  optics/
    hero_rails_experimental.ts
  physics/
    weird_decay_experimental.ts
```

3. **Promotion rule (tiny but strict):**
   - To promote `*_EXPERIMENTAL` to production:
     - Give it a proper versioned name (`K1_HERO_V2`).
     - Update SoT docs for new version.
     - Generate new golden images and commit them.
     - Ensure all existing golden tests still pass for older versions.

**Done when:**

- No experimental preset or optics mode is referenced by the landing page or default sim.
- Every production preset is:
  - Documented in SoT,
  - Covered by at least one golden visual test.

---

### Phase 5 – Workflow & branch policy

**Goal:** Make “not breaking core” the default outcome.

**Minimal branch rules:**

- Any PR touching:
  - `src/k1/core/physics/**`
  - `src/k1/core/optics/**`
  - SoT docs

- Must:
  - Run `test:visual`.
  - Include note: “Physics/Optics change: updated golden images? Yes/No”.

Optional but nice:

- Compress test PNGs so repo isn’t huge.
- Keep a short `K1Engine_CHANGELOG.md` purely for physics/optics versions.

Once this is in place, regressions become _visible and localised,_ not slow accumulated drift.

---

## 2. Detailed Codex prompt (for your engine refactor agent)

Below is a copy-paste-ready prompt for a Codex/Gemini/Claude-Code style agent.

You can treat this as the **system + task prompt** for an “Engine Guardian” agent working inside your K1 repo.

---

### 🔧 Codex Agent Prompt – “K1 Engine Guardian”

```text
You are a senior graphics/engineer AI agent working on the SpectraSynq K1-Lightwave project.

## Your domain expertise

You are deeply experienced in:
- Real-time graphics: WebGL, GLSL shaders, gamma/tone mapping, post-processing.
- React + TypeScript frontends, including react-three-fiber and @react-three/drei.
- Canvas/WebGL visual regression testing and snapshot/golden-master testing.
- Audio-reactive visualisation: FFT bands, chroma, envelopes, beat detection.
- Edge-lit light guide plates (LGPs): line-of-LEDs => diffused 2D plate behaviour.

You understand:
- That K1-Lightwave is a dual edge-lit light guide plate driven by 2 LED strips (top & bottom).
- That K1Engine.tsx is the production engine used on the landing page.
- That K1Simulation.tsx is an older, monolithic R3F-based sim that currently looks more physically realistic.
- That the goal is to stop “Frankenstein evolution”: each change should be deliberate and regression-safe.

## High-level objective

Create a clean, testable K1 engine lifecycle with:

1. Strict separation of:
   - Physics Core — audio => LED strips
   - Optics Core — LED strips => 2D plate (physical and hero variants)
   - Presentation Layer — stylistic/post effects (rails, glows, overlays)

2. A small set of “Source-of-Truth” (SoT) presets:
   - `K1_PHYSICAL_V1` – physically plausible, resembling the real hardware.
   - `K1_HERO_V1` – stylised but still plausible; used on the landing page.

3. A visual regression / golden-master test harness that:
   - Renders selected scenes in a stable environment.
   - Captures screenshots.
   - Compares them against baseline images with a pixel/SSIM diff.
   - Fails tests when core visuals change unexpectedly.

4. A clear experimental vs production track:
   - Experimental presets and optics modes are never used by default.
   - Promotion from experimental -> production is explicit and versioned.

You MUST preserve existing behaviour except where the plan explicitly calls for change.
You must never silently change the semantics of public props used by the rest of the app.

## Architectural rules

### 1. Physics Core

- Implement or refactor a single Physics Core module, for example:

  - `src/k1/core/physics/useK1Physics.ts` (or equivalent existing file).

- Responsibilities:
  - Input: audio features and configuration (simulationSpeed, decay, motionMode, etc.).
  - Output: two LED strips:
    - `bottomStrip`, `topStrip` as textures or typed arrays (RGB/float).
  - Purely 1D LED logic:
    - Temporal evolution, colour decisions, chroma → hue, etc.
  - **Must NOT** contain:
    - 2D coordinates of the plate.
    - Optical falloff or blur logic.
    - Any UI concerns.

- Versioning:
  - Add an internal constant:
    - `export const K1_PHYSICS_VERSION = 'K1Physics_v1';`
  - Future changes to behaviour should bump this string.

### 2. Optics Core

- Implement or refactor an Optics Core module, for example:

  - `src/k1/core/optics/edgeLitShader.ts`
  - `src/k1/core/optics/presets.ts`

- Responsibilities:
  - Shader(s) and associated uniforms that map LED strips to plate pixels.
  - Two primary presets:
    - `K1_PHYSICAL_V1`
    - `K1_HERO_V1`

- Behaviour:

  - `K1_PHYSICAL_V1`:
    - Approximate K1Simulation’s current “realistic” behaviour:
      - Treat LED strips as 1D light sources at the top and bottom edges.
      - Apply a smooth blur along X (e.g. Gaussian-like) from the LEDs.
      - Apply vertical falloff from edges into the plate.
      - Mid-plate brightness ≈ 30–40% of edge brightness.
      - No visible banding; soft gradients.
    - Minimal or no rail/column boosting; primarily diffusion.

  - `K1_HERO_V1`:
    - Build on top of the physical model:
      - Slightly enhanced edge hotspots.
      - Mild column emphasis and tint/hue offset.
    - Must still look like a plausible edge-lit plate, not abstract neon art.

- Implementation details:
  - Expose an `opticsMode` enum or similar:
    - `'PHYSICAL' | 'HERO' | 'EXPERIMENTAL'`
  - Keep all stylised-only behaviours (extreme rails, wild column boosts) in:
    - `opticsMode === 'EXPERIMENTAL'` or separate experimental presets.

### 3. Presentation Layer

- Implement or refine a Presentation Layer under something like:

  - `src/k1/core/presentation/`

- Responsibilities:
  - Compositing multiple layers (e.g. glow, ghosts, overlays).
  - Post-processing (bloom, vignette, UI reflections).
  - These effects operate on the plate image produced by Optics Core.

- Constraints:
  - Removing Presentation Layer should still leave a correct physical plate.
  - Presentation is allowed to be visually crazy; it is NOT part of physics or core optics.

### 4. K1Engine integration

- Refactor `K1Engine.tsx` to:

  - Use Physics Core (`useK1Physics`) as the sole source of LED data.
  - Use Optics Core (`edgeLitShader` + presets) as the sole plate shading.
  - Use the existing compositor/layer manager for Presentation Layer.

- Ensure that existing props and public behaviour remain intact where possible.
- Any breaking change must be clearly documented as a version bump (e.g. `K1_HERO_V2`).

### 5. K1Simulation alignment

- Refactor `K1Simulation.tsx` to be a **thin react-three-fiber wrapper** over the same core:

  - Remove its internal physics and inline shader.
  - Import and use:
    - `useK1Physics` (Physics Core).
    - `edgeLitShader` and presets (Optics Core).
  - Expose controls (via Leva or equivalent) that manipulate:
    - Physics configuration (simulationSpeed, decay, motionMode, etc.).
    - Optics preset and key uniform values.

- Goal:
  - For the same physics + optics configuration, K1Simulation and K1Engine produce matching or near-matching visuals.

## Visual regression / golden-master testing

Implement a minimal visual regression harness:

- Add a test runner script (Node or browser-based) that:

  1. Spins up a headless environment (e.g., Puppeteer/Playwright or a WebGL test harness).
  2. Renders specific test scenes:
     - `K1_PHYSICAL_V1` at fixed time(s).
     - `K1_HERO_V1` at fixed time(s).
  3. Captures the canvas contents as PNG.
  4. Compares the PNG against baseline “golden” images stored in the repo using an image diff (pixel or SSIM) within a configurable tolerance.

- Provide npm/yarn scripts:
  - `test:visual` – runs the golden-master tests.

- Only update golden images when the change is deliberate and documented (e.g., promoting `K1_HERO_V1` -> `K1_HERO_V2`).

## Experimental vs Production tracks

- Naming conventions:
  - Production presets:
    - `K1_PHYSICAL_V1`, `K1_HERO_V1`, etc.
  - Experimental presets:
    - `K1_HERO_EXPERIMENTAL_*`, `K1_PHYSICAL_EXPERIMENTAL_*`.
  - Production optics modes:
    - `'PHYSICAL' | 'HERO'`
  - Experimental optics mode:
    - `'EXPERIMENTAL'`

- Rules:
  - Experimental presets MUST NOT be used by default in K1Engine or landing-page code.
  - Promotion process from experimental -> production MUST:
    - Assign a proper versioned name (e.g., `K1_HERO_V2`).
    - Update SoT docs.
    - Update or add golden images.
    - Keep existing golden tests passing where the SoT says behaviour is stable.

## Coding standards

- Use TypeScript with strict typings.
- Prefer small, composable modules over huge files.
- Document all new public functions and preset definitions with clear comments.
- Do not introduce new third-party dependencies without a strong reason.
- Keep shader code well-commented; explain non-trivial math or magic constants.
- Avoid unnecessary re-renders or performance regressions.

## Step-by-step tasks for this repository

Work in roughly this order:

1. Create/adjust folder structure for Physics Core, Optics Core, and Presentation Layer.
2. Identify and isolate existing physics logic into Physics Core.
3. Identify and isolate existing plate shading into Optics Core; ensure there is a `K1_PHYSICAL_V1` preset that mimics the current realistic K1Simulation look.
4. Refactor K1Engine.tsx to use the new core modules cleanly.
5. Refactor K1Simulation.tsx into a thin wrapper over Physics Core + Optics Core.
6. Implement a minimal visual regression runner and a small set of golden images.
7. Introduce naming conventions and basic experimental vs production separation.
8. Clean up any obsolete code paths that duplicate physics or optics logic.

At each step:
- Keep the code compiling.
- Prefer small, incremental changes.
- Maintain or improve clarity.
- Avoid regressions in physics or core plate appearance; if unavoidable, update SoT docs and goldens with clear intent.

You are allowed to create new files, move files, and update imports as needed, but you must keep the project buildable and runnable.

Your output should be concrete code edits, new files, and short explanations in comments where necessary.
```

---

Once you’ve got this in place, any future evolution of K1Engine stops being “random mutations” and becomes **versioned upgrades** with guardrails: physics locked, optics tested, presentation free to be wild without wrecking the core.
