import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LED_COUNT = 160;
const LED_STRIDE = 4; // RGBA

export type DiagnosticMode = 'NONE' | 'TOP_ONLY' | 'BOTTOM_ONLY' | 'COLLISION';

interface PhysicsParams {
  simulationSpeed: number;
  decay: number;
  ghostAudio: boolean;
  motionMode: string;
  diagnosticMode: DiagnosticMode;
}

/**
 * Core Physics Kernel for the K1 Lightwave.
 * Simulates dual-channel LED buffers with independent signal processing and fluid dynamics.
 */
export function useK1Physics(params: PhysicsParams) {
  // --- TEXTURE MANAGEMENT (IMPERATIVE) ---
  const texBottom = useMemo(() => {
    const data = new Float32Array(LED_COUNT * 4);
    const t = new THREE.DataTexture(data, LED_COUNT, 1, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, []);

  const texTop = useMemo(() => {
    const data = new Float32Array(LED_COUNT * 4);
    const t = new THREE.DataTexture(data, LED_COUNT, 1, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, []);

  // --- STATE CONTAINERS ---
  // Mutable state for 120Hz loop to avoid Garbage Collection
  const physicsState = useRef({
    bottom: {
      leds: new Float32Array(LED_COUNT * LED_STRIDE),
      huePos: 0.0,
    },
    top: {
      leds: new Float32Array(LED_COUNT * LED_STRIDE),
      huePos: 0.5,
    },
    time: 0,
  });

  // --- HELPERS ---

  const copyPixel = (buffer: Float32Array, destIdx: number, srcIdx: number) => {
    const d = destIdx * LED_STRIDE;
    const s = srcIdx * LED_STRIDE;
    buffer[d] = buffer[s];
    buffer[d + 1] = buffer[s + 1];
    buffer[d + 2] = buffer[s + 2];
    buffer[d + 3] = buffer[s + 3];
  };

  // Shift pixels based on motion mode
  const shiftLeds = (leds: Float32Array, mode: string, direction: 'normal' | 'reverse') => {
    const center = LED_COUNT / 2;

    if (mode === 'Center Origin') {
      // Shift Outwards
      for (let i = LED_COUNT - 1; i > center; i--) copyPixel(leds, i, i - 1);
      for (let i = 0; i < center; i++) copyPixel(leds, i, i + 1);
    } else {
      // Linear Flow
      if (direction === 'normal') {
        // L -> R
        for (let i = LED_COUNT - 1; i > 0; i--) copyPixel(leds, i, i - 1);
      } else {
        // R -> L
        for (let i = 0; i < LED_COUNT - 1; i++) copyPixel(leds, i, i + 1);
      }
    }
  };

  const hsvToRgb = (hInput: number, s: number, v: number) => {
    let r = 0,
      g = 0,
      b = 0;
    let h = hInput % 1;
    if (h < 0) h += 1;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return { r, g, b };
  };

  const addColor = (
    leds: Float32Array,
    idx: number,
    r: number,
    g: number,
    b: number,
    intensity: number
  ) => {
    if (idx < 0 || idx >= LED_COUNT) return;
    const i = idx * LED_STRIDE;
    leds[i] = Math.min(2.0, leds[i] + r * intensity);
    leds[i + 1] = Math.min(2.0, leds[i + 1] + g * intensity);
    leds[i + 2] = Math.min(2.0, leds[i + 2] + b * intensity);
    leds[i + 3] = 1.0;
  };

  // --- RENDER LOOP ---
  useFrame((_state, delta) => {
    const dt = delta * params.simulationSpeed;
    const s = physicsState.current;
    s.time += dt;

    // --- 1. DETERMINISTIC SIGNAL GENERATION ---
    // Replace random ghostAudio with multi-frequency oscillators
    // Bottom (Transient): Fast, punchy sine wave (2Hz) + Pulse
    // Top (Sustained): Slow, rolling sine wave (0.2Hz)

    const t = s.time;
    let bottomTrigger = 0;
    let topTrigger = 0;

    if (params.ghostAudio && params.diagnosticMode === 'NONE') {
      // Bottom: Mimic kick drum / transient
      // Sharp pulse every 0.5s
      const beat = (t * 2.0) % 1.0;
      if (beat < 0.1) bottomTrigger = 1.0;

      // Top: Mimic pad / atmosphere
      // Slow undulation
      topTrigger = (Math.sin(t * 0.5) + 1.0) * 0.5; // 0 to 1
    }

    // --- 2. DIAGNOSTIC OVERRIDE ---
    if (params.diagnosticMode !== 'NONE') {
      bottomTrigger = 0;
      topTrigger = 0;

      // Fixed patterns for inspection
      // Use absolute indices to avoid motionMode mirroring logic interference
      const center = Math.floor(LED_COUNT / 2);

      if (params.diagnosticMode === 'TOP_ONLY' || params.diagnosticMode === 'COLLISION') {
        // Inject into Top
        // Static bright lobes at 25%, 50%, 75%
        addColor(s.top.leds, Math.floor(LED_COUNT * 0.25), 1, 1, 1, 0.5);
        addColor(s.top.leds, center, 1, 1, 1, 0.5); // True center
        addColor(s.top.leds, Math.floor(LED_COUNT * 0.75), 1, 1, 1, 0.5);
      }

      if (params.diagnosticMode === 'BOTTOM_ONLY' || params.diagnosticMode === 'COLLISION') {
        // Inject into Bottom
        addColor(s.bottom.leds, Math.floor(LED_COUNT * 0.25), 1, 1, 1, 0.5);
        addColor(s.bottom.leds, center, 1, 1, 1, 0.5); // True center
        addColor(s.bottom.leds, Math.floor(LED_COUNT * 0.75), 1, 1, 1, 0.5);
      }
    }

    // --- 3. PHYSICS UPDATE (Dual Channel) ---

    // -- BOTTOM CHANNEL (Transient) --
    // Fast decay
    const bottomDecay = params.decay * 1.2;
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) s.bottom.leds[i] *= 1.0 - bottomDecay;

    // Disable shift/mirroring during diagnostics to keep patterns static and clean
    if (params.diagnosticMode === 'NONE') {
      shiftLeds(s.bottom.leds, params.motionMode, 'normal');
    }

    // -- TOP CHANNEL (Sustained) --
    // Slow decay
    const topDecay = params.decay * 0.5;
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) s.top.leds[i] *= 1.0 - topDecay;

    // Disable shift/mirroring during diagnostics
    if (params.diagnosticMode === 'NONE') {
      shiftLeds(s.top.leds, params.motionMode, 'reverse');
    }

    // --- 4. INJECTION ---
    s.bottom.huePos += 0.002 * params.simulationSpeed;
    s.top.huePos += 0.001 * params.simulationSpeed;

    const colB = hsvToRgb(s.bottom.huePos, 1.0, 1.0);
    const colT = hsvToRgb(s.top.huePos, 0.8, 0.8);

    if (bottomTrigger > 0) {
      const pos = params.motionMode === 'Center Origin' ? LED_COUNT / 2 : 0;
      // Punchy injection
      addColor(s.bottom.leds, pos, colB.r, colB.g, colB.b, bottomTrigger * 2.0);
    }

    if (topTrigger > 0) {
      const pos = params.motionMode === 'Center Origin' ? LED_COUNT / 2 : LED_COUNT - 1;
      // Soft injection (accumulates due to slow decay)
      addColor(s.top.leds, pos, colT.r, colT.g, colT.b, topTrigger * 0.1);
    }

    // --- 5. TEXTURE UPLOAD ---
    texBottom.image.data.set(s.bottom.leds);
    texBottom.needsUpdate = true;

    texTop.image.data.set(s.top.leds);
    texTop.needsUpdate = true;
  });

  return {
    texBottom,
    texTop,
    ledCount: LED_COUNT,
  };
}
