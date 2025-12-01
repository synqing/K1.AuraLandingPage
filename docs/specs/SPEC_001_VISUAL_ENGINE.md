# K1 Visual Synthesis Engine: Technical Architecture & Implementation Specification

**Version:** 2.0.0  
**Status:** Draft Specification  
**Target Runtime:** WebGL 2.0 (Three.js / React Three Fiber)  
**Language:** TypeScript / GLSL  

---

## 1. Executive Summary

This document serves as the detailed Technical Design Document (TDD) for the **K1 Visual Synthesis Engine**, a browser-based visual simulator designed for the procedural generation, real-time manipulation, and physics-based simulation of the K1 Audio-Reactive Light Guide.

The system is architected to support **120Hz real-time rendering**, **layered visual composition**, **sub-millisecond latency parameter tuning**, and **high-fidelity export capabilities**. It bridges the gap between offline CGI tools (like Blender/Houdini) and embedded firmware development, providing a "pixel-perfect" reference for hardware engineers.

---

## 2. System Architecture

The application follows a **Hybrid Reactive/Imperative** architecture. The UI and Application State are managed Reactively (React/Zustand), while the Render Loop and Physics Simulation are managed Imperatively (Three.js/Direct WebGL calls) to ensure consistent frame budgets.

### 2.1 High-Level Data Flow

```mermaid
graph TD
    User[User Input] -->|Events| UI[Reactive UI (Leva/React)]
    UI -->|Mutations| Store[Zustand State Store]
    
    subgraph "Render Loop (60-120Hz)"
        Store -.->|Transient Subscription| Engine[Simulation Engine]
        Engine -->|Update| Physics[Physics Kernel (CPU)]
        Physics -->|Float32Array| DataTex[Data Texture Generation]
        DataTex -->|Upload| GPU[GPU Shader Pipeline]
        GPU -->|Render| FBO[Frame Buffer Object (Layer)]
        FBO -->|Composite| Post[Post-Processing Stack]
        Post -->|Draw| Screen[Canvas Output]
    end

    subgraph "Export Pipeline"
        Screen -->|CaptureStream| Encoder[MediaRecorder / FFmpeg.wasm]
        Encoder -->|Blob| File[MP4/PNG Export]
    end
```

### 2.2 Core Technologies

*   **Runtime:** React 18 + Next.js 14 (App Router)
*   **Graphics Core:** Three.js (r160+)
*   **Scene Graph Abstraction:** React-Three-Fiber (R3F) v8+
*   **State Management:** Zustand (w/ Transient Updates via `subscribeWithSelector`)
*   **GUI:** Leva (Debug) / Radix UI (Production Controls)
*   **Shader Language:** GLSL ES 3.0

---

## 3. Core Modules Specification

### 3.1 The Visual Layer System (VLS)

The engine treats every visual element as an independent **Layer**. A Layer is an encapsulated rendering context that outputs to a **WebGLRenderTarget** (FBO) rather than the screen. This allows for "Photoshop-like" blending and composition.

#### 3.1.1 Layer Interface (`IVisualLayer`)

```typescript
interface IVisualLayer {
    id: string;
    type: 'simulation' | 'image' | 'video' | 'generator';
    visible: boolean;
    opacity: number; // 0.0 - 1.0
    blendMode: BlendMode; // 'ADD' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY'
    
    // The Render Target where this layer draws its content
    fbo: THREE.WebGLRenderTarget; 
    
    // The Scene graph specific to this layer
    scene: THREE.Scene;
    camera: THREE.Camera;
    
    // Lifecycle methods
    onRender(dt: number, renderer: THREE.WebGLRenderer): void;
    onResize(width: number, height: number): void;
    dispose(): void;
}
```

#### 3.1.2 Composition Pipeline

The **Compositor** is a full-screen quad render pass that iterates through all active layers. It uses a custom fragment shader to blend them based on their `blendMode`.

**Compositor Fragment Logic (Pseudo-GLSL):**
```glsl
uniform sampler2D tLayer0;
uniform sampler2D tLayer1;
// ... up to N layers

void main() {
    vec4 base = texture2D(tLayer0, vUv);
    vec4 blend = texture2D(tLayer1, vUv);
    
    // Independent Opacity Control
    blend.a *= uLayer1Opacity;
    
    // Blend Equation
    vec3 finalRGB = mix(base.rgb, blend.rgb, blend.a); // Normal
    // OR
    // finalRGB = base.rgb + blend.rgb * blend.a; // Additive
    
    gl_FragColor = vec4(finalRGB, 1.0);
}
```

### 3.2 Physics Simulation Kernel (The "K1 Logic")

The simulation attempts to mimic the exact behavior of the ESP32 firmware running on the physical device.

#### 3.2.1 Data Structures
*   **LED State Buffer:** `Float32Array(160 * 4)` (RGBA per LED).
*   **Chromagram:** `Float32Array(12)` (FFT energy per musical note).
*   **Energy History:** Circular buffer for temporal smoothing.

#### 3.2.2 Implementation Strategy
To maintain 120Hz performance, we avoid creating new objects (Garbage Collection pauses). We use a single allocated `ref` object for the simulation state.

```typescript
// The Kernel runs inside useFrame()
useFrame((state, delta) => {
    // 1. Time Dilation
    const dt = delta * params.timeScale;

    // 2. Signal Processing (Run FFT logic or Ghost Audio)
    updateSignalProcessing(dt);

    // 3. Physics Solve (Diffusion & Decay)
    //    Uses a conceptual "Bucket Brigade" Delay Line
    for (let i = LED_COUNT - 1; i > 0; i--) {
        ledBuffer[i] = lerp(ledBuffer[i], ledBuffer[i-1], dt * diffusionRate);
    }

    // 4. Texture Upload
    //    Only upload if changes exceed a threshold (dirty checking)
    dataTexture.needsUpdate = true;
});
```

### 3.3 The "Scrubbable" Parameter System

We require a UI that offers numeric precision with mouse-based gestural control.

#### 3.3.1 Component: `<ScrubInput />`
*   **Interaction:** Click-and-drag on the label to adjust value.
*   **Modifiers:**
    *   `Shift`: 10x multiplier (Coarse adjustment).
    *   `Alt`: 0.1x multiplier (Fine adjustment).
    *   `DblClick`: Reset to default.
*   **Validation:** Clamp values to `min`/`max`. Parse generic mathematical expressions (e.g., allowing user to type "5*2" or "pi").

---

## 4. Advanced Features Specification

### 4.1 Custom Shader Injection (CSI)

Advanced users require the ability to modify the visual output at the GLSL level without recompiling the application.

#### 4.1.1 Implementation
We utilize `THREE.OnBeforeCompile` to inject user-defined string tokens into standard material shaders.

**Injection Points:**
1.  `#include <common>` -> Inject Uniform definitions.
2.  `#include <color_fragment>` -> Inject Color modification logic.

**Security:** Since this runs client-side, we can allow raw GLSL. However, infinite loops in fragment shaders will hang the GPU. We implement a **Safe Compilation** wrapper:
1.  Compile shader in a background `OffscreenCanvas`.
2.  Check `gl.getShaderParameter(shader, gl.COMPILE_STATUS)`.
3.  Only apply to the main scene if successful; otherwise return parse errors to the UI.

### 4.2 Timeline & Keyframing

To support "Temporal Manipulation," we implement a linear interpolation engine.

#### 4.2.1 Data Model
```json
{
  "duration": 10000, // ms
  "tracks": [
    {
      "target": "Visuals.Falloff",
      "keyframes": [
        { "time": 0, "value": 3.5, "easing": "linear" },
        { "time": 5000, "value": 8.0, "easing": "easeInOutCubic" }
      ]
    }
  ]
}
```

#### 4.2.2 Playback Engine
At every frame `t`:
1.  Identify active tracks.
2.  Binary search for the two keyframes surrounding `t`.
3.  Calculate normalized progress `p = (t - k1.time) / (k2.time - k1.time)`.
4.  Apply easing function: `p_eased = Easing[k1.easing](p)`.
5.  Interpolate: `currentValue = k1.value + (k2.value - k1.value) * p_eased`.
6.  **Directly mutate** the Store State (bypassing React render cycle).

---

## 5. Feedback & Analysis Tools

### 5.1 Visual Debuggers
*   **Waveform Monitor:** Draws the raw `Float32Array` buffer as a line graph overlay.
*   **Vectorscope:** Plots the Hue/Saturation distribution of the LED array on a polar coordinate system.
*   **FPS/Memory Overlay:** Uses `gl.getExtension('EXT_disjoint_timer_query')` (if available) or `performance.now()` to track GPU draw times.

### 5.2 Comparison Engine (A/B Testing)
A "Split Screen" shader effect that renders:
*   **Left Half:** Snapshot A (stored in a frozen Texture).
*   **Right Half:** Live Rendering.
*   **Divider:** Movable vertical line controlled by mouse x-position.

---

## 6. Export & Serialization Strategy

### 6.1 High-Resolution Still Export
To export print-ready images (e.g., 4k/8k):
1.  **Pause** the simulation loop.
2.  Resize the internal `WebGLRenderer` to the target resolution (e.g., 3840x2160).
3.  Set `renderer.setPixelRatio(1)`.
4.  Render one frame.
5.  Call `canvas.toBlob('image/png')`.
6.  Restore original resolution and resume loop.

### 6.2 Video Export (MP4)
Using `ffmpeg.wasm` is preferred over `MediaRecorder` for frame-perfect rendering (non-realtime).
1.  **Step Mode:** The engine switches to "Frame Stepping" mode.
2.  **Capture:**
    *   Render Frame 0.
    *   Read pixels to Uint8Array.
    *   Pass buffer to FFmpeg worker.
    *   Advance simulation by fixed time step `dt = 1/60`.
3.  **Finalize:** FFmpeg compiles the buffer into an H.264 .mp4 file and offers download.

---

## 7. Performance Optimization Guidelines

### 7.1 Memory Management
*   **Object Pooling:** Reuse `Vector3`, `Color`, and `Matrix4` instances. Never use `new THREE.Vector3()` inside the render loop.
*   **Geometry Sharing:** All particle systems must use `InstancedMesh` or sharing the same `BufferGeometry`.
*   **Texture Uploads:** Only upload textures when data changes. Use `gl.texSubImage2D` if updating only a portion of the texture (though for 1x160, full upload is negligible).

### 7.2 Shader Optimization
*   **Precision:** Use `mediump float` for color calculations; `highp float` only for position/UVs.
*   **Branching:** Avoid `if/else` inside fragments. Use `step()`, `mix()`, and `smoothstep()`.
*   **Texture Lookups:** Minimize dependent texture reads.

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Completed)
- [x] Basic React/Three.js Setup.
- [x] Core Physics Kernel (Diffusion/Gaussian).
- [x] Basic Leva UI.

### Phase 2: Layer System (Week 1)
- [ ] Implement `FBOManager` class.
- [ ] Create `Compositor` pass.
- [ ] Build `LayerList` UI component.

### Phase 3: Timeline & Automation (Week 2)
- [ ] Implement Keyframe Data Structure.
- [ ] Build Timeline UI (Canvas-based).
- [ ] Connect Interpolation Engine to Zustand Store.

### Phase 4: Export & Polish (Week 3)
- [ ] Integrate `ffmpeg.wasm`.
- [ ] Implement High-Res Screenshot Tiling.
- [ ] Add "Preset" saving/loading (Local Storage + JSON download).

---

**Approved By:** System Architect  
**Date:** 2025-11-21
 
## 9. Rendering Policy
 
- No overlays, vignettes, gradients, masks, or UI elements may modify or occlude the visualization output without explicit approval.
- The visualization container must render the engine output unmodified. Any decorative effects must be positioned behind or outside the visualization region and must be symmetric if used.
- UI changes must not alter perceived top/bottom symmetry. Verification requires diagnostics sweep (TOP_ONLY, BOTTOM_ONLY, EDGES_ONLY) with timeline disabled and ghost audio off.
- Violations of this policy are treated as defects; fixes must remove or neutralize the influence before release.
