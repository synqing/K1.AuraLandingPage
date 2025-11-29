# K1 Visual Simulator

This tool provides a real-time physics simulation of the K1 Audio-Reactive Light Guide. It allows designers and engineers to fine-tune the visual algorithms before deploying to firmware.

## Controls

### Visuals

- **Falloff:** Controls the exponential decay of light as it travels up the chassis. Higher values = shorter beams.
- **Exposure:** Controls the overall brightness and "bloom" intensity.
- **Spread:** Determines the scattering coefficient. Higher values = softer, more diffuse light.
- **BaseLevel:** Sets the minimum brightness of the LEDs (bias).
- **Tint:** Global color multiplier.

### Simulation

- **SimulationSpeed:** Time dilation factor. 1.0 = Realtime.
- **Decay:** How quickly the light trails fade out.
- **Ghost Audio:** Simulates random input signals for testing without a microphone.

### Export

- **Save PNG:** Captures the current frame at full canvas resolution.

## Architecture

The simulation runs on a hybrid CPU/GPU pipeline:

1.  **CPU (120Hz):** Calculates the `Float32Array` LED state (160x4 RGBA) using a custom physics model (oscillation, decay, shift-register).
2.  **Bus:** Uploads state to a `DataTexture`.
3.  **GPU:** A custom fragment shader applies Gaussian smoothing and variable beam falloff to simulate the physical properties of edge-lit acrylic.

## Integration

To use these values in the firmware:

1.  Tune the visuals here until satisfied.
2.  Copy the values (Falloff, Spread) to the `constants.h` file in the C++ firmware project.
