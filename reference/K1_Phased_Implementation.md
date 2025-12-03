MODE: EXPLORATION

Nice, this is the right question: _“How do we stop this thing turning into Frankenstein every time we ‘improve’ it?”_

Answer: we **package the whole approach as an engine lifecycle**, not just a one-off refactor. That means:

1. A phased implementation plan you can aim a Codex/Gemini agent at.
2. A heavyweight prompt that bakes in the architecture, constraints, and standards.

---

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
