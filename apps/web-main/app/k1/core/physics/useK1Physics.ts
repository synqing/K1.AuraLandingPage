/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    K1 PHYSICS CORE - CENTER ORIGIN MANDATE                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  ⚠️  CRITICAL: ALL LIGHT INJECTION MUST BE CENTER-ORIGIN SYMMETRIC  ⚠️    ║
 * ║                                                                           ║
 * ║  This file implements the core physics simulation for K1 LED strips.      ║
 * ║  The CENTER ORIGIN MANDATE requires:                                      ║
 * ║                                                                           ║
 * ║  1. Light MUST be injected at TWO SYMMETRIC positions from center         ║
 * ║     - posLeft = center - offset                                           ║
 * ║     - posRight = center + offset                                          ║
 * ║                                                                           ║
 * ║  2. The shiftLeds() function MUST shift outward from center               ║
 * ║     - Left half (0 to center-1): shifts LEFT (toward index 0)             ║
 * ║     - Right half (center to 159): shifts RIGHT (toward index 159)         ║
 * ║                                                                           ║
 * ║  3. motionMode MUST always be 'Center Origin'                             ║
 * ║     - 'Left Origin' and 'Right Origin' are DEPRECATED                     ║
 * ║                                                                           ║
 * ║  REGRESSION WARNING: Any code that injects light at a SINGLE POINT        ║
 * ║  or at EDGES is a CENTER ORIGIN VIOLATION and will be rejected.           ║
 * ║                                                                           ║
 * ║  Visual Reference: /vis_lab_physical_shader_test.png (CORRECT)            ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const K1_PHYSICS_VERSION = 'K1Physics_v1';

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
  mode?: 'Existing' | 'Snapwave' | 'Bloom';
  autoColorShift?: boolean;
  hueOffset?: number;
  prismCount?: number;
  prismOpacity?: number;
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
    fieldPrev: new Float32Array(LED_COUNT * LED_STRIDE), // For Bloom sprite blending
    huePos: 0.0,
    time: 0,
    lastPhase: 0,
    topBuf: new Float32Array(LED_COUNT * LED_STRIDE),
    bottomBuf: new Float32Array(LED_COUNT * LED_STRIDE),
    waveformPeakScaled: 0,
    waveformPeakScaledLast: 0,
    chromagram: new Float32Array(12), // 12 musical notes (C through B)
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

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * CENTER ORIGIN SHIFT ALGORITHM
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * This function shifts LED values OUTWARD from the center, creating the
   * signature "breathing from center" visual effect.
   *
   * CENTER ORIGIN MODE (MANDATORY):
   * - Right half (indices 80-159): Each LED copies from its LEFT neighbor
   *   → Values propagate RIGHTWARD (toward edge)
   * - Left half (indices 0-79): Each LED copies from its RIGHT neighbor
   *   → Values propagate LEFTWARD (toward edge)
   *
   * Visual effect:
   *   Frame N:   [.......●●.......]  (light at center)
   *   Frame N+1: [......●  ●......]  (expands outward)
   *   Frame N+2: [.....●    ●.....]  (continues to edges)
   *
   * ⚠️ WARNING: 'Left Origin' and 'Right Origin' modes are DEPRECATED.
   * They violate the CENTER ORIGIN MANDATE and must NOT be used.
   * ═══════════════════════════════════════════════════════════════════════════
   */
  const shiftLeds = (leds: Float32Array, mode: string) => {
    const center = LED_COUNT / 2; // center = 80

    if (mode === 'Center Origin') {
      // RIGHT HALF: Shift values rightward (toward index 159)
      // Each LED copies from its LEFT neighbor, pushing content to the right
      for (let i = LED_COUNT - 1; i > center; i--) copyPixel(leds, i, i - 1);

      // LEFT HALF: Shift values leftward (toward index 0)
      // Each LED copies from its RIGHT neighbor, pushing content to the left
      for (let i = 0; i < center; i++) copyPixel(leds, i, i + 1);
    } else if (mode === 'Left Origin') {
      // ⚠️ DEPRECATED - DO NOT USE - Violates Center Origin Mandate
      for (let i = LED_COUNT - 1; i > 0; i--) copyPixel(leds, i, i - 1);
    } else {
      // ⚠️ DEPRECATED - DO NOT USE - Violates Center Origin Mandate
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

    if (params.diagnosticMode === 'NONE' && params.mode === 'Snapwave') {
      const bottom = s.bottomBuf;
      const top = s.topBuf;

      if (params.ghostAudio) {
        const beatPhase = (s.time * 1.25) % 1.0;
        const envRaw = Math.max(0.0, Math.sin(beatPhase * Math.PI));
        s.waveformPeakScaled = 0.6 * envRaw + 0.2 * Math.random();
      }
      const peakNow = s.waveformPeakScaled;
      const smoothed = peakNow * 0.1 + s.waveformPeakScaledLast * 0.9;
      s.waveformPeakScaledLast = smoothed;

      const absAmp = Math.min(1.0, Math.abs(peakNow));
      const dynamicFade = 1.0 - 0.1 * absAmp;
      for (let i = 0; i < LED_COUNT * LED_STRIDE; i++)
        field[i] *= (1.0 - params.decay) * dynamicFade;

      shiftLeds(field, params.motionMode);

      s.huePos += 0.002 * params.simulationSpeed + (params.hueOffset ?? 0);
      const millis = s.time * 1000.0;
      const osc = Math.tanh(Math.sin(millis * 0.002) * 2.0);
      let amp = osc * s.waveformPeakScaledLast * 0.7;
      if (amp > 1.0) amp = 1.0;
      if (amp < -1.0) amp = -1.0;

      /**
       * ═══════════════════════════════════════════════════════════════════════
       * CENTER ORIGIN SYMMETRIC INJECTION (SNAPWAVE MODE)
       * ═══════════════════════════════════════════════════════════════════════
       *
       * THIS IS THE CRITICAL CENTER ORIGIN CODE. DO NOT MODIFY WITHOUT
       * UNDERSTANDING THE MANDATE.
       *
       * The injection algorithm:
       * 1. Calculate center point (LED 80 for 160 LEDs)
       * 2. Calculate symmetric offset based on oscillation amplitude
       * 3. Inject light at TWO positions: posLeft AND posRight
       *
       * Visual result:
       *   [.......●...........●.......]
       *           ↑           ↑
       *        posLeft     posRight
       *
       * ⚠️ REGRESSION WARNING: If you change this to a SINGLE addColor() call,
       * you will BREAK the center origin mandate and the visualization will
       * show light at edges/random positions instead of symmetric from center.
       *
       * CORRECT: Two addColor() calls at symmetric positions
       * WRONG:   Single addColor() call at any position
       * ═══════════════════════════════════════════════════════════════════════
       */
      const center = Math.floor(LED_COUNT / 2); // center = 80
      const col = hsvToRgb(s.huePos, 1.0, 1.0);
      const intensity = 0.5 + 0.5 * Math.abs(s.waveformPeakScaledLast);

      // Calculate symmetric offset: larger amplitude = wider spread from center
      const displacement = Math.abs(amp);
      const offset = Math.floor(displacement * (center * 0.9)); // Max spread = 72 LEDs from center

      // Calculate symmetric injection positions
      const posLeft = Math.max(0, center - offset); // LEFT of center (toward index 0)
      const posRight = Math.min(LED_COUNT - 1, center + offset); // RIGHT of center (toward index 159)

      // ═══════════════════════════════════════════════════════════════════════
      // INJECT AT BOTH SYMMETRIC POSITIONS - THIS IS THE CENTER ORIGIN MANDATE
      // ═══════════════════════════════════════════════════════════════════════
      addColor(field, posLeft, col.r, col.g, col.b, intensity); // LEFT injection
      addColor(field, posRight, col.r, col.g, col.b, intensity); // RIGHT injection

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
      return;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * BLOOM MODE - Ported from Sensorybridge firmware light_mode_bloom()
     * ═══════════════════════════════════════════════════════════════════════════
     *
     * Algorithm:
     * 1. draw_sprite: Blend previous frame with alpha=0.99 (temporal persistence)
     * 2. Chromagram synthesis: Sum 12 bins → single RGB color
     * 3. Center injection at positions 79/80 (CENTER ORIGIN COMPLIANT)
     * 4. Edge fade + mirror
     *
     * Source: lightshow_modes.h lines 398-499
     * ═══════════════════════════════════════════════════════════════════════════
     */
    if (params.diagnosticMode === 'NONE' && params.mode === 'Bloom') {
      const bottom = s.bottomBuf;
      const top = s.topBuf;
      const fieldPrev = s.fieldPrev;
      const chromagram = s.chromagram;
      const center = Math.floor(LED_COUNT / 2); // 80

      // --- Simulate chromagram from ghost audio (12 bins for musical notes) ---
      // Only 2-3 bins active at once (like real music) to get DISTINCT COLORS not white
      let totalMagnitude = 0;
      if (params.ghostAudio) {
        const beatPhase = (s.time * 1.2) % 1.0;
        const envelope = Math.max(0.0, Math.sin(beatPhase * Math.PI));

        // Dominant note cycles through chromagram over time
        const dominantNote = Math.floor((s.time * 0.5) % 12);

        for (let i = 0; i < 12; i++) {
          // Only bins near the dominant note are active
          const distFromDominant = Math.min(
            Math.abs(i - dominantNote),
            12 - Math.abs(i - dominantNote) // wrap around
          );

          if (distFromDominant <= 1) {
            // Strong for dominant and adjacent notes
            chromagram[i] = envelope * (0.8 - distFromDominant * 0.3);
          } else {
            // Very weak for distant notes
            chromagram[i] = envelope * 0.05;
          }
          totalMagnitude += chromagram[i];
        }
      }

      // === STEP 1: CLEAR output to zero ===
      field.fill(0);

      // === STEP 2: draw_sprite - blend previous frame with alpha ===
      // Firmware: draw_sprite(leds_16, leds_16_prev, 128, 128, 0.250 + 1.750 * CONFIG.MOOD, 0.99)
      // CONFIG.MOOD changes with audio - THIS CREATES THE WAVE MOTION
      const alpha = 0.97; // Slightly faster fade for more motion
      // MUCH more dynamic mood - full 0→1 range with beat envelope
      const beatPhase2 = (s.time * 1.2) % 1.0;
      const beatEnvelope = Math.pow(Math.max(0, Math.sin(beatPhase2 * Math.PI)), 0.5);
      const mood = beatEnvelope; // Full 0→1 range with beat
      const position = 0.0 + 3.0 * mood; // LARGER range: 0 → 3 pixels drift
      const positionWhole = Math.floor(position);
      const positionFract = position - positionWhole;
      const mixRight = positionFract;
      const mixLeft = 1.0 - mixRight;

      for (let i = 0; i < LED_COUNT; i++) {
        const posLeft = i + positionWhole;
        const posRight = i + positionWhole + 1;

        if (posLeft >= 0 && posLeft < LED_COUNT) {
          const srcIdx = i * LED_STRIDE;
          const dstIdx = posLeft * LED_STRIDE;
          field[dstIdx] += fieldPrev[srcIdx] * mixLeft * alpha;
          field[dstIdx + 1] += fieldPrev[srcIdx + 1] * mixLeft * alpha;
          field[dstIdx + 2] += fieldPrev[srcIdx + 2] * mixLeft * alpha;
        }
        if (posRight >= 0 && posRight < LED_COUNT) {
          const srcIdx = i * LED_STRIDE;
          const dstIdx = posRight * LED_STRIDE;
          field[dstIdx] += fieldPrev[srcIdx] * mixRight * alpha;
          field[dstIdx + 1] += fieldPrev[srcIdx + 1] * mixRight * alpha;
          field[dstIdx + 2] += fieldPrev[srcIdx + 2] * mixRight * alpha;
        }
      }

      // === STEP 3: Chromagram color synthesis ===
      // Share controls contribution per bin - higher = more vibrant
      const share = 1.0 / 4.0; // Increased from 1/6 for more vibrancy
      let sumR = 0,
        sumG = 0,
        sumB = 0;

      for (let i = 0; i < 12; i++) {
        const hue = i / 12.0;
        const bin = chromagram[i];
        // Use sqrt instead of square for less aggressive compression
        const value = Math.sqrt(bin) * share;
        const col = hsvToRgb(hue, 1.0, value);
        sumR += col.r;
        sumG += col.g;
        sumB += col.b;
      }

      // Soft clamp with headroom for HDR
      if (sumR > 2.0) sumR = 2.0;
      if (sumG > 2.0) sumG = 2.0;
      if (sumB > 2.0) sumB = 2.0;

      // === STEP 4: Center injection (positions 79/80) ===
      const idxLeft = (center - 1) * LED_STRIDE;
      const idxRight = center * LED_STRIDE;
      field[idxLeft] = sumR;
      field[idxLeft + 1] = sumG;
      field[idxLeft + 2] = sumB;
      field[idxLeft + 3] = 1.0;
      field[idxRight] = sumR;
      field[idxRight + 1] = sumG;
      field[idxRight + 2] = sumB;
      field[idxRight + 3] = 1.0;

      // === STEP 5: Copy current to prev ===
      fieldPrev.set(field);

      // === STEP 6: Edge fade (last 32 pixels on right side) ===
      const fadeLength = Math.floor(LED_COUNT * 0.2); // 32 for 160 LEDs
      for (let i = 0; i < fadeLength; i++) {
        const prog = i / (fadeLength - 1);
        const fadeMultiplier = prog * prog;
        const idx = (LED_COUNT - 1 - i) * LED_STRIDE;
        field[idx] *= fadeMultiplier;
        field[idx + 1] *= fadeMultiplier;
        field[idx + 2] *= fadeMultiplier;
      }

      // === STEP 7: Mirror - copy right half to left half ===
      for (let i = 0; i < center; i++) {
        const srcIdx = (LED_COUNT - 1 - i) * LED_STRIDE;
        const dstIdx = i * LED_STRIDE;
        field[dstIdx] = field[srcIdx];
        field[dstIdx + 1] = field[srcIdx + 1];
        field[dstIdx + 2] = field[srcIdx + 2];
        field[dstIdx + 3] = field[srcIdx + 3];
      }

      // === Update textures ===
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
      return;
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
        addColor(field, center - 1, 1, 1, 1, 1.0);
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
        addColor(field, center - 1, 1, 1, 1, 1.0);
        addColor(field, center, 1, 1, 1, 1.0);
        bottom.set(field);
      } else if (params.diagnosticMode === 'COLLISION') {
        addColor(field, center - 1, 1, 1, 1, 1.0);
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
      if (params.motionMode === 'Center Origin') {
        addColor(field, center - 1, col.r, col.g, col.b, trigger * 2.0);
        addColor(field, center, col.r, col.g, col.b, trigger * 2.0);
      } else if (params.motionMode === 'Left Origin') {
        addColor(field, 0, col.r, col.g, col.b, trigger * 2.0);
      } else {
        addColor(field, LED_COUNT - 1, col.r, col.g, col.b, trigger * 2.0);
      }
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
