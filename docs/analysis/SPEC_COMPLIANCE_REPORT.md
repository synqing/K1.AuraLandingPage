# Spec-to-Code Audit Report
**Date:** 2025-11-29
**Target:** `apps/web-main` vs `docs/specs/SPEC_001_VISUAL_ENGINE.md`

## 1. Executive Summary
The current codebase represents a **functional prototype (Phase 1)** of the Visual Engine. It successfully implements the core physics loop, WebGL rendering, and basic parameter tuning.

However, it **lacks the architectural modularity** defined in the Specification (Phase 2+). The "Layer System," "Timeline," and "Custom Shader Injection" features are missing. The application is currently a monolithic React component rather than an extensible engine.

## 2. Compliance Matrix

| Feature ID | Spec Requirement | Status | Findings |
| :--- | :--- | :--- | :--- |
| **3.1** | **Visual Layer System** | 🔴 **Missing** | No `IVisualLayer` interface. No `Compositor`. Logic is hardcoded in `K1Simulation.tsx`. |
| **3.2** | **Physics Kernel** | 🟢 **Compliant** | `Float32Array` buffers, `useFrame` loop, and signal processing logic are correctly implemented. |
| **3.3** | **Scrubbable Params** | 🟡 **Partial** | Uses standard `Leva` controls instead of the custom `<ScrubInput />` gesture UI. |
| **4.1** | **Shader Injection** | 🔴 **Missing** | Shaders are hardcoded strings. No `OnBeforeCompile` pipeline exists. |
| **4.2** | **Timeline Engine** | 🔴 **Missing** | No keyframing or interpolation logic found. |
| **6.1** | **Export (Still)** | 🟢 **Compliant** | Basic PNG export is implemented via Leva button. |
| **6.2** | **Export (Video)** | 🔴 **Missing** | No `ffmpeg.wasm` integration or frame stepping logic. |

## 3. Critical Gaps (Technical Debt)

### A. Monolithic `K1Simulation.tsx`
The entire engine lives in one file (~300 lines).
- **Risk:** Impossible to add new visual modes (e.g., "Fire", "Rain") without copy-pasting the whole file.
- **Remediation:** Refactor into `useSimulationLoop` hook and separate `VisualLayer` components.

### B. Hardcoded Shaders
The fragment shader is a template literal inside TypeScript.
- **Risk:** Poor developer experience (no syntax highlighting), hard to maintain.
- **Remediation:** Move shaders to `*.glsl` files and use a loader, or implement the CSI system.

## 4. Recommendations for Phase 3

1.  **Refactor:** Split `K1Simulation.tsx` into:
    -   `engine/PhysicsKernel.ts` (The pure JS logic)
    -   `engine/LayerManager.ts` (The VLS architecture)
    -   `components/Viewport.tsx` (The R3F Canvas)
2.  **Implement Layers:** Create the `IVisualLayer` class and port the current "Edge-Lit" effect as the first concrete Layer implementation.
3.  **Upgrade UI:** Replace Leva with the custom "Scrubbable" UI for better precision.

## 5. Conclusion
The foundation is solid/performant (120Hz capable), but the *Architecture* needs a significant refactor to match the Specification before adding new features.
