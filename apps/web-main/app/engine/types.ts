import * as THREE from 'three';

/**
 * Supported blend modes for the compositor.
 */
export type BlendMode = 'NORMAL' | 'ADD' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY';

/**
 * Represents a single visual layer in the engine.
 * Each layer renders to its own FBO before being composited.
 */
export interface IVisualLayer {
  id: string;
  name: string;
  type: 'simulation' | 'image' | 'video' | 'generator';
  visible: boolean;
  opacity: number; // 0.0 - 1.0
  blendMode: BlendMode;

  // The render target for this layer (created and managed by the Layer Component)
  fbo?: THREE.WebGLRenderTarget;

  // Uniforms specific to this layer's shader
  uniforms: Record<string, THREE.IUniform>;
}

/**
 * The global state of the physics simulation.
 * Kept mutable for performance (120Hz updates).
 */
export interface SimulationState {
  leds: Float32Array; // The raw LED buffer (160 * 4)
  chromagram: Float32Array; // FFT data
  time: number; // Simulation time in seconds
}
