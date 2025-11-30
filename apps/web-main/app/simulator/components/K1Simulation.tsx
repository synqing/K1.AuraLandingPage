'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls, folder, button } from 'leva';

// --- SHADER DEFINITION ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uLedStateBottom;
  uniform sampler2D uLedStateTop;
  uniform float uResolution;
  uniform float uFalloff;
  uniform float uExposure;
  uniform float uSpread;
  uniform float uBaseLevel;
  uniform vec3 uTint;
  
  varying vec2 vUv;

  float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
  }

  // Sample a single LED strip with blur
  vec3 sampleStrip(sampler2D strip, vec2 uv, float spreadBase) {
    vec3 accumulatedColor = vec3(0.0);
    float totalWeight = 0.0;
    float samples = 7.0; 
    float pixelWidth = 1.0 / uResolution;
    float currentSigma = spreadBase;

    for(float i = -samples; i <= samples; i++) {
      float offset = i * pixelWidth;
      float weight = gaussian(offset, currentSigma);
      vec2 sampleUv = vec2(clamp(uv.x + offset, 0.0, 1.0), 0.5);
      accumulatedColor += texture2D(strip, sampleUv).rgb * weight;
      totalWeight += weight;
    }
    return accumulatedColor / totalWeight;
  }

  void main() {
    // 1. Vertical Gradients (Dual Edge-Lit)
    // Bottom Light fades as it goes Up (y -> 1)
    float bottomInfluence = pow(1.0 - vUv.y, uFalloff);
    
    // Top Light fades as it goes Down (y -> 0)
    float topInfluence = pow(vUv.y, uFalloff);

    // 2. Dynamic Scattering (Blur width increases away from source)
    float bottomSpread = uSpread * (0.2 + vUv.y * 3.0);
    float topSpread = uSpread * (0.2 + (1.0 - vUv.y) * 3.0);

    // 3. Sample both textures
    vec3 colorBottom = vec3(0.0);
    vec3 colorTop = vec3(0.0);
    
    // We can't do if(texture) in GLSL, but the JS side handles the null.
    // However, if the texture IS black/empty, we get nothing.
    // Let's ensure we are sampling correctly.
    
    colorBottom = sampleStrip(uLedStateBottom, vUv, bottomSpread);
    colorTop = sampleStrip(uLedStateTop, vUv, topSpread);

    // 4. Additive Blending
    vec3 finalColor = (colorBottom * bottomInfluence) + (colorTop * topInfluence);

    // 5. Edge Hotspots (Physical LED Visibility)
    float bottomHotspot = smoothstep(0.02, 0.0, vUv.y);
    float topHotspot = smoothstep(0.98, 1.0, vUv.y);
    float totalHotspot = (bottomHotspot * length(colorBottom)) + (topHotspot * length(colorTop));

    // 6. Final Mix
    vec3 outColor = finalColor + uBaseLevel;
    outColor = outColor * uExposure + (vec3(1.0) * totalHotspot * 4.0);
    outColor *= uTint;

    gl_FragColor = vec4(outColor, 1.0);
  }
`;

// --- SIMULATION LOGIC ---
const LED_COUNT = 160;
const LED_STRIDE = 4; // RGBA

export function K1Simulation() {
  const { gl, scene, camera } = useThree();

  // --- CONTROLS ---
  const {
    falloff,
    exposure,
    spread,
    baseLevel,
    simulationSpeed,
    decay,
    tint,
    ghostAudio,
    temporalOffset,
    motionMode,
  } = useControls('K1 Lightwave Engine', {
    Visuals: folder({
      falloff: { value: 1.5, min: 0.5, max: 5.0 },
      exposure: { value: 4.0, min: 0.1, max: 20.0 },
      spread: { value: 0.015, min: 0.001, max: 0.1 },
      baseLevel: { value: 0.0, min: 0.0, max: 1.0 },
      tint: { value: '#ffffff' },
    }),
    Sequencing: folder({
      temporalOffset: { value: 120, min: 0, max: 500, label: 'Offset (ms)' },
      motionMode: {
        options: ['Center Origin', 'Left Origin', 'Right Origin'],
        value: 'Center Origin',
      },
    }),
    Simulation: folder({
      simulationSpeed: { value: 1.0, min: 0.1, max: 5.0 },
      decay: { value: 0.15, min: 0.01, max: 0.5 },
      ghostAudio: { value: true },
    }),
    Export: folder({
      'Save PNG': button(() => {
        gl.render(scene, camera);
        const link = document.createElement('a');
        link.setAttribute('download', `k1-sim-${Date.now()}.png`);
        link.setAttribute('href', gl.domElement.toDataURL('image/png'));
        link.click();
      }),
    }),
  });

  // --- STATE & REFS ---
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // IMPERATIVE TEXTURE MANAGEMENT (No React Components)
  // We create the textures once on mount.
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

  // Dual History Buffers for Temporal Sequencing
  // We store past states to "replay" them on the Top channel with a delay
  // 120fps * 2 seconds = 240 frames buffer
  const historyRef = useRef<Float32Array[]>([]);
  const MAX_HISTORY = 240;

  const simState = useRef({
    currentFrameLeds: new Float32Array(LED_COUNT * LED_STRIDE),
    chromagram: new Float32Array(12),
    time: 0,
    hue_pos: 0.0,
  });

  // --- INITIALIZATION ---
  const uniforms = useMemo(
    () => ({
      uLedStateBottom: { value: texBottom },
      uLedStateTop: { value: texTop },
      uResolution: { value: LED_COUNT },
      uFalloff: { value: falloff },
      uExposure: { value: exposure },
      uSpread: { value: spread },
      uBaseLevel: { value: baseLevel },
      uTint: { value: new THREE.Color(tint) },
    }),
    []
  );

  // --- HELPERS ---
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

  const addColor = (leds: Float32Array, idx: number, r: number, g: number, b: number) => {
    if (idx < 0 || idx >= LED_COUNT) return;
    const i = idx * LED_STRIDE;
    leds[i] = Math.min(1.5, leds[i] + r);
    leds[i + 1] = Math.min(1.5, leds[i + 1] + g);
    leds[i + 2] = Math.min(1.5, leds[i + 2] + b);
    leds[i + 3] = 1.0;
  };

  // --- RENDER LOOP ---
  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const dt = delta * simulationSpeed;
    const s = simState.current;
    s.time += dt;

    // Update Uniforms
    const mat = materialRef.current;
    mat.uniforms.uFalloff.value = falloff;
    mat.uniforms.uExposure.value = exposure;
    mat.uniforms.uSpread.value = spread;
    mat.uniforms.uBaseLevel.value = baseLevel;
    mat.uniforms.uTint.value.set(tint);

    // --- 1. GENERATE MASTER SIGNAL (PHYSICS) ---

    // Audio Input
    if (ghostAudio && Math.random() > 0.92) {
      const note = [0, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
      s.chromagram[note] = 1.0;
    }
    for (let i = 0; i < 12; i++) s.chromagram[i] *= 0.92;

    // Global Decay
    for (let i = 0; i < LED_COUNT * LED_STRIDE; i++) s.currentFrameLeds[i] *= 1.0 - decay;

    // Advection (Movement)
    shiftLeds(s.currentFrameLeds, motionMode);

    // Oscillator
    let oscillation = 0;
    const millis = s.time * 1000;
    for (let i = 0; i < 12; i++) {
      if (s.chromagram[i] > 0.05) {
        oscillation += s.chromagram[i] * Math.sin(millis * 0.001 * (1.0 + i * 0.5));
      }
    }
    oscillation = Math.tanh(oscillation * 2.0);

    // Inject Color
    s.hue_pos += 0.005 * simulationSpeed;
    const col = hsvToRgb(s.hue_pos, 1.0, 1.0);
    const center = LED_COUNT / 2;

    if (motionMode === 'Center Origin') {
      // Mirror Mode
      const displacement = Math.abs(oscillation);
      const offset = Math.floor(displacement * (center * 0.9));

      let posA = center + offset;
      if (posA >= LED_COUNT) posA = LED_COUNT - 1;
      addColor(s.currentFrameLeds, posA, col.r, col.g, col.b);

      let posB = center - offset;
      if (posB < 0) posB = 0;
      if (offset > 0 || posA !== posB) {
        addColor(s.currentFrameLeds, posB, col.r, col.g, col.b);
      } else {
        addColor(s.currentFrameLeds, posB, col.r, col.g, col.b);
      }
    } else {
      // Linear Modes
      // Map oscillation (-1 to 1) to position (0 to 160)
      let pos = Math.floor(center + oscillation * center * 0.9);
      if (pos < 0) pos = 0;
      if (pos >= LED_COUNT) pos = LED_COUNT - 1;
      addColor(s.currentFrameLeds, pos, col.r, col.g, col.b);
    }

    // --- 2. TEMPORAL SEQUENCING (HISTORY BUFFER) ---

    // Push current frame to history
    // We must CLONE the array, otherwise we store references to the same mutable buffer
    const frameSnapshot = new Float32Array(s.currentFrameLeds);
    historyRef.current.unshift(frameSnapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.pop();
    }

    // Calculate Delay Frame
    // 120ms delay at 60fps (~16ms) is approx 7 frames
    // We approximate: Frames = Delay(ms) / (1000/60)
    const delayFrames = Math.floor(temporalOffset / 16.6);
    const topFrameIndex = Math.min(delayFrames, historyRef.current.length - 1);

    const bottomLeds = s.currentFrameLeds; // Live
    const topLeds = historyRef.current[topFrameIndex] || s.currentFrameLeds; // Delayed

    // --- 3. UPLOAD TEXTURES (IMPERATIVE) ---
    texBottom.image.data.set(bottomLeds);
    texBottom.needsUpdate = true;

    texTop.image.data.set(topLeds);
    texTop.needsUpdate = true;
  });

  // --- COMPONENT ---
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[32, 6]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        transparent={true}
      />
    </mesh>
  );
}
