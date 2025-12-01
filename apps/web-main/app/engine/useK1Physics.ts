import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LED_COUNT = 160;
const LED_STRIDE = 4;

export type DiagnosticMode = 'NONE' | 'TOP_ONLY' | 'BOTTOM_ONLY' | 'COLLISION' | 'EDGES_ONLY';

interface PhysicsParams {
  simulationSpeed: number;
  decay: number;
  ghostAudio: boolean;
  motionMode: string;
  diagnosticMode: DiagnosticMode;
  heroMode?: boolean;
  heroLoopDuration?: number;
}

/**
 * Core Physics Kernel for the K1 Lightwave.
 * Simulates dual-channel LED buffers with independent signal processing and fluid dynamics.
 */
export function useK1Physics(params: PhysicsParams) {
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

  const physicsState = useRef({
    field: new Float32Array(LED_COUNT * LED_STRIDE),
    huePos: 0.0,
    time: 0,
    lastPhase: 0,
    topBuf: new Float32Array(LED_COUNT * LED_STRIDE),
    bottomBuf: new Float32Array(LED_COUNT * LED_STRIDE),
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

  const shiftLeds = (leds: Float32Array, mode: string) => {
    const center = LED_COUNT / 2;
    if (mode === 'Center Origin') {
      for (let i = LED_COUNT - 1; i > center; i--) copyPixel(leds, i, i - 1);
      for (let i = 0; i < center; i++) copyPixel(leds, i, i + 1);
    } else if (mode === 'Left Origin') {
      for (let i = LED_COUNT - 1; i > 0; i--) copyPixel(leds, i, i - 1);
    } else {
      for (let i = 0; i < LED_COUNT - 1; i++) copyPixel(leds, i, i + 1);
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

  useFrame((_state, delta) => {
    const dt = delta * params.simulationSpeed;
    const s = physicsState.current;
    s.time += dt;

    const field = s.field;

    let trigger = 0;
    if (params.diagnosticMode === 'NONE') {
      if (params.heroMode) {
        const loopDur = params.heroLoopDuration ?? 20.0;
        const phasePrev = s.lastPhase;
        const phase = s.time % loopDur;
        // Reset field on loop boundary to avoid drift
        if (phase < phasePrev) {
          for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) field[i] = 0;
        }
        // Deterministic trigger schedule aligned with hero segments
        const schedule = [2.0, 5.0, 10.0];
        for (let i = 0; i < schedule.length; i++) {
          const t = schedule[i];
          if (phasePrev < t && phase >= t) {
            trigger = 1.0;
            break;
          }
        }
        s.lastPhase = phase;
      } else if (params.ghostAudio) {
        const beat = (s.time * 2.0) % 1.0;
        if (beat < 0.1) trigger = 1.0;
      }
    }

    if (params.diagnosticMode !== 'NONE') {
      field.fill(0);
      const center = Math.floor(LED_COUNT / 2);
      const bottom = s.bottomBuf;
      const top = s.topBuf;
      bottom.fill(0);
      top.fill(0);

      if (params.diagnosticMode === 'EDGES_ONLY') {
        addColor(field, 0, 1, 1, 1, 1.0);
        addColor(field, LED_COUNT - 1, 1, 1, 1, 1.0);
        bottom.set(field);
        for (let i = 0; i < LED_COUNT; i++) {
          const src = i * LED_STRIDE;
          const dst = (LED_COUNT - 1 - i) * LED_STRIDE;
          top[dst] = field[src];
          top[dst + 1] = field[src + 1];
          top[dst + 2] = field[src + 2];
          top[dst + 3] = field[src + 3];
        }
      } else if (params.diagnosticMode === 'TOP_ONLY') {
        addColor(field, center, 1, 1, 1, 1.0);
        for (let i = 0; i < LED_COUNT; i++) {
          const src = i * LED_STRIDE;
          const dst = (LED_COUNT - 1 - i) * LED_STRIDE;
          top[dst] = field[src];
          top[dst + 1] = field[src + 1];
          top[dst + 2] = field[src + 2];
          top[dst + 3] = field[src + 3];
        }
      } else if (params.diagnosticMode === 'BOTTOM_ONLY') {
        addColor(field, center, 1, 1, 1, 1.0);
        bottom.set(field);
      } else if (params.diagnosticMode === 'COLLISION') {
        addColor(field, center, 1, 1, 1, 1.0);
        bottom.set(field);
        for (let i = 0; i < LED_COUNT; i++) {
          const src = i * LED_STRIDE;
          const dst = (LED_COUNT - 1 - i) * LED_STRIDE;
          top[dst] = field[src];
          top[dst + 1] = field[src + 1];
          top[dst + 2] = field[src + 2];
          top[dst + 3] = field[src + 3];
        }
      }

      texBottom.image.data.set(bottom);
      texBottom.needsUpdate = true;
      texTop.image.data.set(top);
      texTop.needsUpdate = true;
      return;
    }

    const decay = params.decay;
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) field[i] *= 1.0 - decay;

    shiftLeds(field, params.motionMode);

    s.huePos += 0.002 * params.simulationSpeed;
    const col = hsvToRgb(s.huePos, 1.0, 1.0);
    if (trigger > 0) {
      const center = Math.floor(LED_COUNT / 2);
      let pos = center;
      if (params.motionMode === 'Left Origin') pos = 0;
      else if (params.motionMode === 'Right Origin') pos = LED_COUNT - 1;
      addColor(field, pos, col.r, col.g, col.b, trigger * 2.0);
    }

    const bottom = s.bottomBuf;
    const top = s.topBuf;
    bottom.set(field);
    for (let i = 0; i < LED_COUNT; i++) {
      const src = i * LED_STRIDE;
      const dst = (LED_COUNT - 1 - i) * LED_STRIDE;
      top[dst] = field[src];
      top[dst + 1] = field[src + 1];
      top[dst + 2] = field[src + 2];
      top[dst + 3] = field[src + 3];
    }

    texBottom.image.data.set(bottom);
    texBottom.needsUpdate = true;
    texTop.image.data.set(top);
    texTop.needsUpdate = true;
  });

  return {
    texBottom,
    texTop,
    ledCount: LED_COUNT,
  };
}
