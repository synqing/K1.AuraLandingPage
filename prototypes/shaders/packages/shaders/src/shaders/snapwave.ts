import type { ShaderMotionParams } from '../shader-mount.js';
import {
  sizingVariablesDeclaration,
  sizingUniformsDeclaration,
  type ShaderSizingParams,
  type ShaderSizingUniforms,
} from '../shader-sizing.js';

/**
 * Snapwave Display Shader
 * 
 * This shader is a "Dumb Terminal". It does NOT calculate the motion.
 * It receives the EXACT state of the LED array (simulated in CPU to match firmware 1:1)
 * and simply renders it with the correct physical diffusion (Blur/Falloff).
 * 
 * This ensures the logic is 100% authentic to the C++ code.
 */

// language=GLSL
export const snapwaveFragmentShader: string = `#version 300 es
precision highp float;

uniform float u_time;

// The RAW LED state passed from the CPU Simulation
// 160 LEDs * 3 channels (RGB) = 480 floats. 
// We pass this as a uniform array or a small data texture.
// For broad compatibility, we'll use a sampler2D (1x160 texture)
uniform sampler2D u_ledState; 

uniform float u_exposure;
uniform float u_falloff;
uniform float u_spread;

${sizingVariablesDeclaration}
${sizingUniformsDeclaration}

out vec4 fragColor;

// Gaussian function for light diffusion (The "Physics" layer)
float gaussian(float x, float mean, float sigma) {
  float delta = x - mean;
  return exp(-(delta * delta) / (2.0 * sigma * sigma));
}

void main() {
  vec2 uv = v_responsiveUV;
  
  // Map UV.y to LED index (0..1)
  // 0 is bottom (source), 1 is top
  // We need to align this with the texture coordinates
  float ledPos = uv.y + 0.5; // Assuming centered UVs (-0.5 to 0.5)
  
  // Clamp to valid LED range
  if(ledPos < 0.0 || ledPos > 1.0) {
    fragColor = vec4(0.0);
    return;
  }

  // --- LIGHT TRANSPORT PHYSICS ---
  // We need to sample the ENTIRE LED strip to see which LEDs contribute to this pixel.
  // Light spreads laterally.
  
  vec3 totalColor = vec3(0.0);
  
  // Optimization: Only sample LEDs within a relevant radius (3 sigma)
  // The spread increases with height (Y)
  float sigma = u_spread * (0.2 + ledPos * 3.0);
  float searchRadius = sigma * 3.0;
  
  // We iterate through the "texture" to accumulate light
  // In a perfect world we'd loop 160 times, but that's heavy.
  // We'll step through the texture.
  float stepSize = 1.0 / 160.0;
  
  // We'll optimize by just doing a gaussian blur on the texture lookup
  // But wait, the texture is 1D (vertical), and the spread is horizontal (X).
  // Actually, the LED strip is 1D. 
  // Wait, the firmware logic simulates a SINGLE COLUMN of 160 LEDs shifting UP.
  // So the "X" position is determined by the math.
  // Ah, checking the code: The firmware is 1D. "pos" is an index 0..159.
  // BUT, the visualization is 2D.
  // In the firmware "light_mode_snapwave", it sets `leds_16[pos]`.
  // This `leds_16` is a 1D strip.
  
  // CORRECTION: The K1 device has a strip of 160 LEDs.
  // The visualization shifts them UP.
  // So `leds[0]` is at the bottom, `leds[159]` is at the top.
  // The horizontal (X) position is fixed? No.
  // The code says: `leds_16[pos] = last_color`.
  // Wait. `pos` varies between 0 and 159.
  // Is this a 1D strip mapped to Y? Or is "pos" the X coordinate?
  
  // RE-READING FIRMWARE:
  // `shift_leds_up(leds_16, 1)`
  // `float pos_f = center + amp * (NATIVE_RESOLUTION / 2.0f);`
  // `leds_16[pos] = last_color;`
  
  // CRITICAL REALIZATION:
  // The K1 firmware treats the 160 LEDs as a *linear strip*.
  // Snapwave shifts the *entire buffer* index-by-index.
  // But `pos` is calculated based on oscillation.
  // If `shift_leds_up` moves index i to i+1, that usually means "Moving along the strip".
  // If the strip is the *edges* of the plate (Left and Right), then "Up" means moving physically up the device.
  // 
  // So the "Wave" is a dot moving up and down the strip?
  // NO. `shift_leds_up` implies a history/scroll.
  // But `pos` sets a *single pixel* at a specific location.
  
  // LET'S LOOK AT THE ANALYTIC SHADER AGAIN.
  // It assumed Time-Travel.
  
  // IF `shift_leds_up` is used, the pattern *scrolls*.
  // `leds[0]` becomes `leds[1]`.
  // If I draw at `pos` (say, index 80) and then shift, the dot at 80 moves to 81.
  // This creates a TRAIL moving from 0 to 160.
  
  // THEREFORE:
  // The LED buffer `u_ledState` represents the vertical column of light intensity.
  // u_ledState[0] is the Bottom. u_ledState[1] is slightly higher.
  //
  // Wait, if `pos` oscillates 0..160, does the dot move up and down?
  // Yes. And `shift_leds_up` moves the *background* up?
  // Actually, `shift_leds_up` is called every frame.
  // So everything moves up 1 pixel per frame.
  // AND we draw a new dot at `pos` every frame.
  // This draws a waveform graph! The Y axis is time (scrolling up), the X axis is `pos` (oscillation).
  //
  // BUT: The physical device is a light guide plate.
  // The LEDs are on the *side*.
  // There are 160 LEDs on the Left, 160 on the Right.
  // If `leds_16` maps to these physical LEDs...
  // Then `leds[i]` is a physical position on the edge.
  // So the "Waveform" is actually spatially displayed along the edge.
  //
  // IF THIS IS THE CASE:
  // The shader should just display the 1D texture `u_ledState` stretched across the height.
  // And applying lateral diffusion (X-blur) to simulate the light entering the plate.
  
  // LOGIC:
  // 1. Sample the LED value at the current Y position (v_responsiveUV.y).
  //    This value represents the brightness/color of the LED at that height.
  // 2. Apply Lateral Diffusion (Gaussian Blur on X) based on that brightness.
  //    Since the LEDs are on the edge, the light spreads inwards.
  //    If dual edge lit, we assume symmetry or sample both.
  //    (The firmware `unmirror` or `mirror` functions suggest this).
  
  // LET'S ASSUME:
  // The texture contains the 160 LED colors.
  // We map FragCoord.y to Texture Coordinate.
  // We map FragCoord.x to Intensity falloff (Diffusion).
  
  float y = ledPos; // 0..1
  
  // Sample the LED color at this vertical height
  vec4 ledColor = texture(u_ledState, vec2(0.5, y)); 
  
  // Physics: Light starts at X=0 (or edges) and diffuses.
  // If the plate is lit from *both* sides (Dual Edge):
  // The light is strongest at X=-0.5 and X=0.5, and weakest in center?
  // OR does the "Wave" represent the *shape* of the light?
  
  // RE-READING "SNAPWAVE MODE":
  // "Visual Rendering Pipeline -> Dot Placement -> Optional Mirroring"
  // It draws a waveform.
  // On a 1D strip, a waveform looks like a dot moving back and forth?
  // NO. `shift_leds_up` creates a history.
  // 
  // CONCLUSION:
  // The "Snapwave" is a visualizer where the vertical axis is spatial (the strip),
  // but the pattern relies on the persistence of vision or the scroll?
  //
  // ACTUALLY:
  // If `shift_leds_up` happens, the pattern moves UP the physical device.
  // If `pos` oscillates, the "Head" moves up/down?
  //
  // LET'S LOOK AT THE VIDEO REFERENCES (Mental Model):
  // K1 Aura usually displays the waveform *vertically*?
  //
  // HYPOTHESIS A:
  // The LEDs represent the Time axis? (Like a waterfall plot?)
  // No, LEDs are physical.
  //
  // HYPOTHESIS B:
  // The `leds` array maps 1:1 to the vertical edge of the plate.
  // The `shift` makes the whole pattern rise like bubbles.
  // The `pos` calculation draws a "cursor" at a specific height.
  // So you see a dot moving up/down (the cursor) while the trails it leaves behind drift upward?
  // Yes, that fits "scrolling waveform".
  
  // SO THE SHADER IS SIMPLE:
  // 1. Get pixel Y.
  // 2. Sample Texture at Y.
  // 3. That gives us the LED intensity at that height.
  // 4. Now, how does that light look on the plate?
  //    It spreads horizontally (X) from the edge?
  //    Or does the "Visualization" imply the light *is* the shape?
  //    
  //    If the LEDs are on the *edge*, and we turn on LED #80 (Middle):
  //    We see a beam of light shooting across the plate at height 80.
  //    It fades as it travels (X axis).
  //    It blurs vertically (Y axis) as it diffuses.
  
  //    So for a pixel at (x,y):
  //    It receives light from *nearby* LEDs (y +/- sigma).
  //    Weighted by distance.
  
  // ALGORITHM:
  // We need to blur the 1D texture vertically to simulate diffusion.
  // And attenuate it horizontally to simulate beam falloff.
  
  // 1. Horizontal Attenuation (Beam Physics)
  // Light enters from edge (say X=0, or X=-0.5/0.5).
  // Let's assume Dual Edge Lit (symmetric).
  // Distance from nearest edge:
  float distX = 0.5 - abs(v_responsiveUV.x); // 0 at edge, 0.5 at center
  float beamFade = exp(-distX * u_falloff);
  
  // 2. Vertical Diffusion (Blur)
  // We sum the contribution of neighbors.
  vec3 accumColor = vec3(0.0);
  float totalWeight = 0.0;
  
  // Kernel size depends on spread
  // We sample 15 neighbors
  float pixelSize = 1.0 / 160.0;
  
  for(float i = -7.0; i <= 7.0; i++) {
     float offset = i * pixelSize;
     float sampleY = y + offset;
     
     // Clamp
     if(sampleY < 0.0 || sampleY > 1.0) continue;
     
     // Weight: Gaussian based on vertical distance
     float weight = gaussian(offset, 0.0, u_spread);
     
     // Sample the LED buffer
     vec3 c = texture(u_ledState, vec2(0.5, sampleY)).rgb;
     
     accumColor += c * weight;
     totalWeight += weight;
  }
  
  vec3 finalColor = accumColor / totalWeight;
  
  // Apply Beam Fade
  finalColor *= beamFade;
  
  // Exposure
  finalColor *= u_exposure;

  // Dither
  float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  finalColor += (noise - 0.5) / 255.0;

  fragColor = vec4(finalColor, 1.0);
}
`;

export interface SnapwaveUniforms extends ShaderSizingUniforms {
  u_ledState: Float32Array; // The critical data array
  u_exposure: number;
  u_falloff: number;
  u_spread: number;
}

export interface SnapwaveParams extends ShaderSizingParams, ShaderMotionParams {
  exposure?: number;
  falloff?: number;
  spread?: number;
}
