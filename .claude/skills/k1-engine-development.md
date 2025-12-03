---
name: k1-engine-development
description: K1 Visual Synthesis Engine development patterns for WebGL shaders, physics simulation, and optical systems. Use when modifying K1Engine, shaders, physics hooks, or visual presets.
---

# K1 Engine Development Skill

## When to Use This Skill

Use this skill when working on:
- Shader modifications (edge-lit, common, optics)
- Physics simulation (`useK1Physics.ts`)
- Visual presets and hero sequences
- Layer composition and blending
- Timeline/sequence controllers
- Any file in `app/engine/` or `app/k1/core/`

## Architecture Understanding

### Hybrid Reactive/Imperative Model
```
Reactive (React/Zustand)          Imperative (Three.js/WebGL)
├── UI State                      ├── Render Loop (60-120Hz)
├── Parameter Controls (Leva)     ├── Physics Kernel
└── Layer Manager                 ├── Shader Uniforms
                                  └── FBO Composition
```

### Key Components
1. **K1Engine.tsx** - Main orchestrator with Leva controls
2. **K1CoreScene.tsx** - Advanced optics rendering (`app/k1/core/view/`)
3. **useK1Physics.ts** - Physics simulation hook
4. **useTimelineController.ts** - Sequence playback
5. **Compositor.tsx** - Layer blending

### Visual Layer System (VLS)
Each layer has:
- Unique ID and type (`simulation | image | video | generator`)
- Dedicated FBO (WebGLRenderTarget)
- Blend mode (`ADD | MULTIPLY | SCREEN | OVERLAY`)
- Independent scene and camera

## Development Checklist

Before modifying K1 Engine code:

- [ ] Read the current implementation fully
- [ ] Check `presets.ts` for existing configurations
- [ ] Understand the data flow (Zustand → Uniforms → GPU)
- [ ] Identify which layer/component is affected

When modifying shaders:

- [ ] Uniforms must be declared in both GLSL and TypeScript
- [ ] Use `common.ts` for shared shader utilities
- [ ] Test at multiple resolutions (1080p, 4K)
- [ ] Verify performance (target: 60Hz minimum)

When modifying physics:

- [ ] Physics runs on CPU, transfers via Float32Array
- [ ] Data textures upload to GPU per frame
- [ ] Keep frame budget under 16ms total

## Shader Modification Pattern

```typescript
// 1. Define uniform type in TypeScript
interface EdgeLitUniforms {
  uTime: { value: number };
  uExposure: { value: number };
  tDiffuse: { value: THREE.Texture };
}

// 2. Declare in GLSL vertex/fragment
uniform float uTime;
uniform float uExposure;
uniform sampler2D tDiffuse;

// 3. Update in render loop via useFrame
useFrame(({ clock }) => {
  materialRef.current.uniforms.uTime.value = clock.elapsedTime;
});
```

## Preset Configuration Pattern

```typescript
// presets.ts - Define deterministic hero preset
export const K1_HERO_PRESET = {
  exposure: 1.2,
  tint: { r: 1.0, g: 0.9, b: 0.8 },
  spread: 0.15,
  falloff: 2.0,
  // ... other optical parameters
};

// Usage in component
const preset = K1_HERO_PRESET;
material.uniforms.uExposure.value = preset.exposure;
```

## Visual Testing After Changes

1. Run dev server: `npm run dev`
2. Navigate to `localhost:3000`
3. Use Leva controls to verify parameters
4. Capture golden image: `npm run test:visual`
5. Compare with previous baseline

## Common Pitfalls

1. **Modifying uniforms without TypeScript types** - Causes runtime errors
2. **Forgetting to dispose WebGLRenderTargets** - Memory leaks
3. **Blocking render loop with heavy computation** - Frame drops
4. **Not using `subscribeWithSelector`** - Unnecessary re-renders
5. **Hardcoding values instead of using presets** - Non-reproducible results

## File Reference

| File | Purpose |
|------|---------|
| `engine/K1Engine.tsx` | Main engine component |
| `engine/presets.ts` | Visual configuration presets |
| `engine/types.ts` | TypeScript interfaces |
| `engine/shaders/edge-lit.ts` | Edge lighting shader |
| `engine/shaders/common.ts` | Shared shader utilities |
| `engine/useK1Physics.ts` | Physics simulation |
| `engine/timeline/useTimelineController.ts` | Sequence playback |
| `k1/core/optics/edgeLitShader.ts` | Advanced optics shader |
| `k1/core/view/K1CoreScene.tsx` | Core scene renderer |
