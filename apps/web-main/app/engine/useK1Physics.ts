import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationState } from './types';

const LED_COUNT = 160;
const LED_STRIDE = 4; // RGBA
const MAX_HISTORY = 240; // 2 seconds at 120fps

interface PhysicsParams {
  simulationSpeed: number;
  decay: number;
  ghostAudio: boolean;
  temporalOffset: number;
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
  const historyRef = useRef<Float32Array[]>([]);

  const simState = useRef<SimulationState>({
    leds: new Float32Array(LED_COUNT * LED_STRIDE),
    chromagram: new Float32Array(12),
    time: 0,
  });

  const internalState = useRef({
    hue_pos: 0.0,
  });

  // --- PHYSICS HELPERS ---
  const shiftLeds = (leds: Float32Array, mode: string) => {
    const center = LED_COUNT / 2;

    if (mode === 'Center Origin') {
      // Shift Outwards
      for (let i = LED_COUNT - 1; i > center; i--) {
        const c = i * LED_STRIDE;
        const p = (i - 1) * LED_STRIDE;
        leds[c] = leds[p];
        leds[c + 1] = leds[p + 1];
        leds[c + 2] = leds[p + 2];
        leds[c + 3] = leds[p + 3];
      }
      for (let i = 0; i < center; i++) {
        const c = i * LED_STRIDE;
        const p = (i + 1) * LED_STRIDE;
        leds[c] = leds[p];
        leds[c + 1] = leds[p + 1];
        leds[c + 2] = leds[p + 2];
        leds[c + 3] = leds[p + 3];
      }
    } else if (mode === 'Left Origin') {
      // Shift Right (0 -> 160)
      for (let i = LED_COUNT - 1; i > 0; i--) {
        const c = i * LED_STRIDE;
        const p = (i - 1) * LED_STRIDE;
        leds[c] = leds[p];
        leds[c + 1] = leds[p + 1];
        leds[c + 2] = leds[p + 2];
        leds[c + 3] = leds[p + 3];
      }
    } else {
      // Shift Left (160 -> 0)
      for (let i = 0; i < LED_COUNT - 1; i++) {
        const c = i * LED_STRIDE;
        const p = (i + 1) * LED_STRIDE;
        leds[c] = leds[p];
        leds[c + 1] = leds[p + 1];
        leds[c + 2] = leds[p + 2];
        leds[c + 3] = leds[p + 3];
      }
    }
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

  const addColor = (leds: Float32Array, idx: number, r: number, g: number, b: number) => {
    if (idx < 0 || idx >= LED_COUNT) return;
    const i = idx * LED_STRIDE;
    leds[i] = Math.min(1.5, leds[i] + r);
    leds[i + 1] = Math.min(1.5, leds[i + 1] + g);
    leds[i + 2] = Math.min(1.5, leds[i + 2] + b);
    leds[i + 3] = 1.0;
  };

  // --- RENDER LOOP ---
  useFrame((_state, delta) => {
    const dt = delta * params.simulationSpeed;
    const s = simState.current;
    const iState = internalState.current;

    s.time += dt;

    // 1. GENERATE MASTER SIGNAL (PHYSICS)
    if (params.ghostAudio && Math.random() > 0.92) {
      const note = [0, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
      s.chromagram[note] = 1.0;
    }
    for (let i = 0; i < 12; i++) s.chromagram[i] *= 0.92;

    // Global Decay
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) s.leds[i] *= 1.0 - params.decay;

    // Advection (Movement)
    shiftLeds(s.leds, params.motionMode);

    // Oscillator
    let oscillation = 0;
    let millis = s.time * 1000;
    for (let i = 0; i < 12; i++) {
      if (s.chromagram[i] > 0.05) {
        oscillation += s.chromagram[i] * Math.sin(millis * 0.001 * (1.0 + i * 0.5));
      }
    }
    oscillation = Math.tanh(oscillation * 2.0);

    // Inject Color
    iState.hue_pos += 0.005 * params.simulationSpeed;
    const col = hsvToRgb(iState.hue_pos, 1.0, 1.0);
    const center = LED_COUNT / 2;

    if (params.motionMode === 'Center Origin') {
      // Mirror Mode
      const displacement = Math.abs(oscillation);
      const offset = Math.floor(displacement * (center * 0.9));

      let posA = center + offset;
      if (posA >= LED_COUNT) posA = LED_COUNT - 1;
      addColor(s.leds, posA, col.r, col.g, col.b);

      let posB = center - offset;
      if (posB < 0) posB = 0;
      addColor(s.leds, posB, col.r, col.g, col.b);
    } else {
      // Linear Modes
      let pos = Math.floor(center + oscillation * center * 0.9);
      if (pos < 0) pos = 0;
      if (pos >= LED_COUNT) pos = LED_COUNT - 1;
      addColor(s.leds, pos, col.r, col.g, col.b);
    }

    // 2. TEMPORAL SEQUENCING (HISTORY BUFFER)
    const frameSnapshot = new Float32Array(s.leds);
    historyRef.current.unshift(frameSnapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.pop();
    }

    // Calculate Delay Frame
    const delayFrames = Math.floor(params.temporalOffset / 16.6);
    const topFrameIndex = Math.min(delayFrames, historyRef.current.length - 1);

    const bottomLeds = s.leds; // Live
    const topLeds = historyRef.current[topFrameIndex] || s.leds; // Delayed

    // 3. UPLOAD TEXTURES
    texBottom.image.data.set(bottomLeds);
    texBottom.needsUpdate = true;

    texTop.image.data.set(topLeds);
    texTop.needsUpdate = true;
  });

  return {
    texBottom,
    texTop,
    ledCount: LED_COUNT,
  };
}
