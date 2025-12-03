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
  mode?: 'Existing' | 'Snapwave';
  autoColorShift: boolean;
  hueOffset: number;
  prismCount: number;
  prismOpacity: number;
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
    chromagram: new Float32Array(12),
    prevChromagram: new Float32Array(12),
    huePos: 0.0,
    time: 0,
    lastPhase: 0,
    topBuf: new Float32Array(LED_COUNT * LED_STRIDE),
    bottomBuf: new Float32Array(LED_COUNT * LED_STRIDE),
    seeded: false,
    waveformPeakScaled: 0,
    waveformPeakScaledLast: 0,
    lastColor: { r: 0, g: 0, b: 0 },
    autoColor: {
      huePosition: 0.0,
      hueShiftSpeed: 0.0,
      huePushDirection: 1.0,
      hueDestination: Math.random(),
      hueShiftingMix: 0.0,
    },
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

  const accumulateChromagramColor = (chromagram: Float32Array, huePos: number) => {
    // Minimal chroma mix: map each bin to hue wheel, square brightness for contrast.
    let totalMag = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    for (let i = 0; i < 12; i++) {
      const bin = chromagram[i];
      let bright = bin;
      // Contrast enhancement similar to squaring iterations
      bright *= bright;
      if (bright > 0.05) {
        const hue = (i / 12 + huePos) % 1;
        const col = hsvToRgb(hue, 1.0, bright);
        sumR += col.r;
        sumG += col.g;
        sumB += col.b;
        totalMag += bright;
      }
    }
    if (totalMag > 0.01) {
      return { r: sumR, g: sumG, b: sumB };
    }
    return { r: 0, g: 0, b: 0 };
  };

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  const updateAutoColorShift = (novelty: number, autoColor: typeof physicsState.current.autoColor) => {
    let n = novelty - 0.1;
    n = clamp01(n);
    n *= 1.111111; // stretch after clipping bottom 10%
    n = clamp01(n);
    n = n * n * n; // cube
    n = Math.min(n, 0.05);

    if (n > autoColor.hueShiftSpeed) {
      autoColor.hueShiftSpeed = n * 0.75;
    } else {
      autoColor.hueShiftSpeed *= 0.99;
    }

    autoColor.huePosition += autoColor.hueShiftSpeed * autoColor.huePushDirection;
    autoColor.huePosition = ((autoColor.huePosition % 1) + 1) % 1;

    if (Math.abs(autoColor.huePosition - autoColor.hueDestination) <= 0.01) {
      autoColor.huePushDirection *= -1;
      autoColor.hueDestination = Math.random();
    }
  };

  const scaleImageToHalf = (src: Float32Array, dst: Float32Array) => {
    const half = LED_COUNT >> 1;
    dst.fill(0);
    for (let i = 0; i < half; i++) {
      const a = (i * 2) * LED_STRIDE;
      const b = (i * 2 + 1) * LED_STRIDE;
      const t = i * LED_STRIDE;
      for (let c = 0; c < LED_STRIDE; c++) {
        dst[t + c] = 0.5 * (src[a + c] + src[b + c]);
      }
    }
  };

  const shiftLedsUp = (leds: Float32Array, offset: number) => {
    if (offset <= 0) return;
    for (let i = LED_COUNT - 1; i >= 0; i--) {
      const dst = i * LED_STRIDE;
      const src = (i - offset) * LED_STRIDE;
      if (i - offset >= 0) {
        leds[dst] = leds[src];
        leds[dst + 1] = leds[src + 1];
        leds[dst + 2] = leds[src + 2];
        leds[dst + 3] = leds[src + 3];
      } else {
        leds[dst] = leds[dst + 1] = leds[dst + 2] = 0;
        leds[dst + 3] = 1.0;
      }
    }
  };

  const mirrorImageDownwards = (leds: Float32Array) => {
    const half = LED_COUNT >> 1;
    for (let i = 0; i < half; i++) {
      const dst = i * LED_STRIDE;
      const src = (LED_COUNT - 1 - i) * LED_STRIDE;
      leds[dst] = leds[src];
      leds[dst + 1] = leds[src + 1];
      leds[dst + 2] = leds[src + 2];
      leds[dst + 3] = leds[src + 3];
    }
  };

  const prismTmp = useRef(new Float32Array(LED_COUNT * LED_STRIDE));
  const prismTmp2 = useRef(new Float32Array(LED_COUNT * LED_STRIDE));

  const applyPrismEffect = (field: Float32Array, iterations: number, opacity: number) => {
    if (iterations <= 0 || opacity <= 0) return;
    const tmp = prismTmp.current;
    const tmp2 = prismTmp2.current;
    for (let it = 0; it < iterations; it++) {
      tmp.set(field);
      scaleImageToHalf(tmp, tmp);
      shiftLedsUp(tmp, LED_COUNT >> 1);
      mirrorImageDownwards(tmp);

      tmp2.set(field);
      for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) {
        field[i] = tmp2[i] + tmp[i] * opacity;
      }
    }
  };

  const scrollTrail = (leds: Float32Array) => {
    for (let i = LED_COUNT - 1; i > 0; i--) {
      const dst = i * LED_STRIDE;
      const src = (i - 1) * LED_STRIDE;
      leds[dst] = leds[src];
      leds[dst + 1] = leds[src + 1];
      leds[dst + 2] = leds[src + 2];
      leds[dst + 3] = leds[src + 3];
    }
    leds[0] = 0;
    leds[1] = 0;
    leds[2] = 0;
    leds[3] = 1.0;
  };

  useFrame((_state, delta) => {
    const dt = delta * params.simulationSpeed;
    const s = physicsState.current;
    s.time += dt;
    if (!s.seeded) {
      const center = Math.floor(LED_COUNT / 2);
      const initCol = hsvToRgb(0.0, 1.0, 1.0);
      addColor(s.field, center - 1, initCol.r, initCol.g, initCol.b, 1.0);
      addColor(s.field, center, initCol.r, initCol.g, initCol.b, 1.0);
      s.bottomBuf.set(s.field);
      for (let i = 0; i < LED_COUNT; i++) {
        const src = i * LED_STRIDE;
        const dst = (LED_COUNT - 1 - i) * LED_STRIDE;
        s.topBuf[dst] = s.field[src];
        s.topBuf[dst + 1] = s.field[src + 1];
        s.topBuf[dst + 2] = s.field[src + 2];
        s.topBuf[dst + 3] = s.field[src + 3];
      }
      texBottom.image.data.set(s.bottomBuf);
      texBottom.needsUpdate = true;
      texTop.image.data.set(s.topBuf);
      texTop.needsUpdate = true;
      s.seeded = true;
    }

    const field = s.field;

    if (params.ghostAudio && Math.random() > 0.92) {
      const note = [0, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
      s.chromagram[note] = 1.0;
      s.waveformPeakScaled = Math.random();
    }
    for (let i = 0; i < 12; i++) s.chromagram[i] *= 0.92;
    // Track previous chroma for novelty
    let novelty = 0;
    for (let i = 0; i < 12; i++) {
      const delta = s.chromagram[i] - s.prevChromagram[i];
      if (delta > 0) novelty += delta;
      s.prevChromagram[i] = s.chromagram[i];
    }
    novelty = Math.sqrt(novelty / 12);

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

    if (params.mode === 'Snapwave') {
      const peakNow = s.waveformPeakScaled;
      const smoothed = peakNow * 0.02 + s.waveformPeakScaledLast * 0.98;
      s.waveformPeakScaledLast = smoothed;

      const absAmp = Math.min(1.0, Math.abs(smoothed));
      const dynamicFade = 1.0 - 0.1 * absAmp;
      for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) field[i] *= dynamicFade;

      // Preserve prior motion feel: small advection along motionMode
      shiftLeds(field, params.motionMode);

      const millis = s.time * 1000.0;
      let oscillation = 0.0;
      for (let i = 0; i < 12; i++) {
        const c = s.chromagram[i];
        if (c > 0.1) {
          const freq = 1.0 + 0.5 * i;
          oscillation += c * Math.sin(millis * 0.001 * freq);
        }
      }
      oscillation = Math.tanh(oscillation * 2.0);

      let amp = oscillation * s.waveformPeakScaledLast * 0.7;
      if (amp > 1.0) amp = 1.0;
      if (amp < -1.0) amp = -1.0;

      const center = Math.floor(LED_COUNT / 2);
      const posF = center + amp * (LED_COUNT / 2);
      let pos = Math.round(posF);
      if (pos < 0) pos = 0;
      if (pos >= LED_COUNT) pos = LED_COUNT - 1;

      if (params.autoColorShift) {
        updateAutoColorShift(novelty, s.autoColor);
      }

      const baseHue = params.hueOffset + (params.autoColorShift ? s.autoColor.huePosition : 0);
      const col = accumulateChromagramColor(s.chromagram, baseHue);
      s.lastColor = { r: col.r, g: col.g, b: col.b };
      addColor(field, pos, col.r, col.g, col.b, 1.0);

      // Post-process prism effect on canonical strip
      applyPrismEffect(field, params.prismCount, params.prismOpacity);
    } else {
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
    }

    const bottom = s.bottomBuf;
    const top = s.topBuf;
    bottom.set(field);
    // For Snapwave, keep the previous motion feel: top rail shares the same orientation as bottom.
    // (Shader still handles symmetric optics.)
    if (params.mode === 'Snapwave') {
      top.set(field);
    } else {
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
  });

  return {
    texBottom,
    texTop,
    ledCount: LED_COUNT,
  };
}
