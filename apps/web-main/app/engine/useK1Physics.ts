import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LED_COUNT = 160;
const LED_STRIDE = 4; // RGBA

interface PhysicsParams {
  simulationSpeed: number;
  decay: number;
  ghostAudio: boolean;
  motionMode: string;
}

export function useK1Physics(params: PhysicsParams) {
  // IMPERATIVE TEXTURE MANAGEMENT
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

  // STATE CONTAINERS
  // We avoid React state for the physics loop to ensure 120Hz performance without garbage collection
  const physicsState = useRef({
    bottom: {
      leds: new Float32Array(LED_COUNT * LED_STRIDE),
      huePos: 0.0,
    },
    top: {
      leds: new Float32Array(LED_COUNT * LED_STRIDE),
      huePos: 0.5, // Start with different color
    },
    chromagram: new Float32Array(12),
    time: 0,
  });

  // --- PHYSICS HELPERS ---
  const shiftLeds = (
    leds: Float32Array,
    mode: string,
    direction: 'normal' | 'reverse' = 'normal'
  ) => {
    const center = LED_COUNT / 2;

    // Determine actual flow direction based on mode and specific edge direction override
    // For K1: Top might flow L->R, Bottom R->L

    if (mode === 'Center Origin') {
      // Shift Outwards from Center
      // Right side (Center -> End)
      for (let i = LED_COUNT - 1; i > center; i--) {
        copyPixel(leds, i, i - 1);
      }
      // Left side (Center -> Start)
      for (let i = 0; i < center; i++) {
        copyPixel(leds, i, i + 1);
      }
    } else {
      // Linear flow
      if (direction === 'normal') {
        // Left to Right (0 -> 160)
        for (let i = LED_COUNT - 1; i > 0; i--) {
          copyPixel(leds, i, i - 1);
        }
      } else {
        // Right to Left (160 -> 0)
        for (let i = 0; i < LED_COUNT - 1; i++) {
          copyPixel(leds, i, i + 1);
        }
      }
    }
  };

  const copyPixel = (buffer: Float32Array, destIdx: number, srcIdx: number) => {
    const d = destIdx * LED_STRIDE;
    const s = srcIdx * LED_STRIDE;
    buffer[d] = buffer[s];
    buffer[d + 1] = buffer[s + 1];
    buffer[d + 2] = buffer[s + 2];
    buffer[d + 3] = buffer[s + 3];
  };

  const hsvToRgb = (h: number, s: number, v: number) => {
    let r = 0,
      g = 0,
      b = 0;
    let i, f, p, q, t;
    h = h % 1;
    if (h < 0) h += 1;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
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
    // Additive mixing with clamping
    leds[i] = Math.min(2.0, leds[i] + r * intensity);
    leds[i + 1] = Math.min(2.0, leds[i + 1] + g * intensity);
    leds[i + 2] = Math.min(2.0, leds[i + 2] + b * intensity);
    leds[i + 3] = 1.0; // Alpha channel (unused for now, but good for structure)
  };

  // --- RENDER LOOP ---
  useFrame((_state, delta) => {
    const dt = delta * params.simulationSpeed;
    const s = physicsState.current;

    s.time += dt;

    // --- 1. SIGNAL PROCESSING (Dual-Channel Ghost Audio) ---
    let triggerBottom = false;
    let triggerTop = false;
    let noteIndex = 0;

    if (params.ghostAudio) {
      const rand = Math.random();
      // Rare, strong transients -> Bottom Edge (Percussive)
      if (rand > 0.96) {
        triggerBottom = true;
        noteIndex = [0, 7, 0, 7][Math.floor(Math.random() * 4)]; // Root/Fifth
      }
      // Frequent, softer pulses -> Top Edge (Harmonic/Atmosphere)
      if (rand > 0.92) {
        triggerTop = true;
        noteIndex = [2, 4, 5, 9, 11][Math.floor(Math.random() * 5)]; // Extensions
      }

      if (triggerBottom || triggerTop) {
        s.chromagram[noteIndex] = 1.0;
      }
    }

    // Decay Chromagram
    for (let i = 0; i < 12; i++) s.chromagram[i] *= 0.92;

    // --- 2. PHYSICS UPDATE (Independent Edges) ---

    // -- BOTTOM EDGE (Percussive, Fast, Punchy) --
    const bottomDecay = params.decay; // Standard decay
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) {
      s.bottom.leds[i] *= 1.0 - bottomDecay;
    }

    // Bottom flows "Normal" (L->R or Center Out)
    shiftLeds(s.bottom.leds, params.motionMode, 'normal');

    // -- TOP EDGE (Atmospheric, Slow, Washy) --
    const topDecay = params.decay * 0.6; // Slower decay
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) {
      s.top.leds[i] *= 1.0 - topDecay;
    }

    // Top flows "Reverse" (R->L or Center Out) to create collisions
    shiftLeds(s.top.leds, params.motionMode, 'reverse');

    // --- 3. COLOR INJECTION ---

    // Evolve hues independently
    s.bottom.huePos += 0.002 * params.simulationSpeed;
    s.top.huePos += 0.001 * params.simulationSpeed; // Slower hue shift on top

    const colBottom = hsvToRgb(s.bottom.huePos, 1.0, 1.0);
    const colTop = hsvToRgb(s.top.huePos, 0.8, 0.8); // Slightly desaturated top

    const center = LED_COUNT / 2;

    // Injection Logic
    if (triggerBottom) {
      // Sharp injection for bottom
      let pos = 0;
      if (params.motionMode === 'Center Origin') pos = center;
      else if (params.motionMode === 'Left Origin') pos = 0;
      else pos = LED_COUNT - 1;

      // Inject with high intensity
      addColor(s.bottom.leds, pos, colBottom.r, colBottom.g, colBottom.b, 1.5);
      // Spread slightly
      addColor(s.bottom.leds, pos + 1, colBottom.r, colBottom.g, colBottom.b, 0.8);
      addColor(s.bottom.leds, pos - 1, colBottom.r, colBottom.g, colBottom.b, 0.8);
    }

    if (triggerTop) {
      // Softer injection for top
      let pos = 0;
      if (params.motionMode === 'Center Origin') pos = center;
      else if (params.motionMode === 'Left Origin')
        pos = LED_COUNT - 1; // Opposite origin for collision
      else pos = 0;

      // Inject with lower intensity but wider area
      addColor(s.top.leds, pos, colTop.r, colTop.g, colTop.b, 0.8);
      addColor(s.top.leds, pos + 1, colTop.r, colTop.g, colTop.b, 0.6);
      addColor(s.top.leds, pos - 1, colTop.r, colTop.g, colTop.b, 0.6);
      addColor(s.top.leds, pos + 2, colTop.r, colTop.g, colTop.b, 0.4);
      addColor(s.top.leds, pos - 2, colTop.r, colTop.g, colTop.b, 0.4);
    }

    // --- 4. UPLOAD TEXTURES ---
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
