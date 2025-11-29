import { useMemo, useRef } from 'react';

// --- CONSTANTS FROM FIRMWARE (SNAPWAVE_ORIGINAL_IMPLEMENTATION.md) ---
const NATIVE_RESOLUTION = 160;
const BASE_FREQUENCY = 0.001;
const PHASE_SPREAD = 0.5;
const AMPLITUDE_SCALE = 0.7;
const TANH_SCALE = 2.0;
const MAX_FADE_REDUCTION = 0.10;
const NOTE_COUNT = 12;

// Mock Chromagram (Simulates the FFT analysis from the firmware)
// In a real app, this would come from an audio analyzer.
class Chromagram {
  values: Float32Array = new Float32Array(NOTE_COUNT);
  smoothValues: Float32Array = new Float32Array(NOTE_COUNT);

  update(time: number) {
    // Simulate random note activation for "Ghost Audio" behavior if no real audio
    // This keeps the visual alive like the firmware's "Ghost Audio"
    for (let i = 0; i < NOTE_COUNT; i++) {
       // Slowly varying noise for each note
       const noise = Math.sin(time * 0.0005 * (i + 1) + i * 43.2);
       // Threshold it to simulate discrete notes
       this.values[i] = noise > 0.8 ? (noise - 0.8) * 5.0 : 0.0;
       
       // Smoothing (matches firmware 0.98 factor)
       this.smoothValues[i] = this.values[i] * 0.02 + this.smoothValues[i] * 0.98;
    }
  }
}

export class SnapwaveFirmware {
  // The State (corresponds to `leds_16` array in C++)
  public leds: Float32Array = new Float32Array(NATIVE_RESOLUTION * 3); // RGB flattened
  
  private chromagram = new Chromagram();
  private waveformPeakScaledLast = 0.0;
  
  // Helper to shift LEDs up (Exact C++ behavior: `shift_leds_up(leds_16, 1)`)
  private shiftLedsUp() {
    // We copy from index 0 to N-2 into index 1 to N-1
    // Since we are flattened RGB, we shift by 3
    for (let i = NATIVE_RESOLUTION - 1; i > 0; i--) {
      const current = i * 3;
      const prev = (i - 1) * 3;
      this.leds[current] = this.leds[prev];
      this.leds[current + 1] = this.leds[prev + 1];
      this.leds[current + 2] = this.leds[prev + 2];
    }
    // Clear bottom row
    this.leds[0] = 0;
    this.leds[1] = 0;
    this.leds[2] = 0;
  }

  // The Core Update Loop (Matches `light_mode_snapwave` in C++)
  public update(timeMs: number, params: { 
      decay: number, 
      density: number, 
      color: [number, number, number] 
  }) {
    this.chromagram.update(timeMs);

    // 1. Dynamic Fading (Trail Logic)
    // C++: abs_amp calculation and dynamic fade
    // We use a simplified peak simulation here if we don't have real audio
    let abs_amp = 0.5; // Nominal value
    
    // C++: SQ15x16 dynamic_fade_amount = 1.0 - (max_fade_reduction * abs_amp);
    // Mapping u_decay param to this logic
    const dynamicFade = 1.0 - (MAX_FADE_REDUCTION * params.decay * abs_amp);

    for (let i = 0; i < this.leds.length; i++) {
      this.leds[i] *= dynamicFade;
    }

    // 2. Shift Up
    this.shiftLedsUp();

    // 3. Oscillation Calculation (The "Snap")
    let oscillation = 0.0;
    
    // C++: for (uint8_t i = 0; i < 12; i++) ...
    for (let i = 0; i < NOTE_COUNT; i++) {
      const noteVal = this.chromagram.smoothValues[i];
      // C++: if (chromagram_smooth[i] > 0.1)
      if (noteVal > 0.1) {
         // C++: oscillation += float(chromagram_smooth[i]) * sin(millis() * 0.001f * (1.0f + i * 0.5f));
         const phase = timeMs * BASE_FREQUENCY * (1.0 + i * PHASE_SPREAD);
         oscillation += noteVal * Math.sin(phase);
      }
    }

    // C++: oscillation = tanh(oscillation * 2.0f);
    oscillation = Math.tanh(oscillation * TANH_SCALE * params.density);

    // 4. Position Calculation
    // C++: amp = oscillation * waveform_peak_scaled_last * 0.7f;
    // We assume waveform_peak is active
    const amp = oscillation * AMPLITUDE_SCALE;

    // C++: float pos_f = center + amp * (NATIVE_RESOLUTION / 2.0f);
    const center = NATIVE_RESOLUTION / 2;
    let posF = center + amp * (NATIVE_RESOLUTION / 2.0);
    
    // C++: int pos = int(pos_f + (pos_f >= 0 ? 0.5 : -0.5));
    let pos = Math.round(posF);
    
    // Bounds checking
    if (pos < 0) pos = 0;
    if (pos >= NATIVE_RESOLUTION) pos = NATIVE_RESOLUTION - 1;

    // 5. Draw the Head
    // C++: leds_16[pos] = last_color;
    const idx = pos * 3;
    this.leds[idx] = params.color[0];
    this.leds[idx + 1] = params.color[1];
    this.leds[idx + 2] = params.color[2];
  }
}
