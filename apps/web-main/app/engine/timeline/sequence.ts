import { TimelineSequence } from './types';
import { K1_HERO_PRESET } from '../K1Engine';

export const K1_HERO_TIMELINE: TimelineSequence = [
  {
    name: 'Void (Simmer)',
    startTime: 0.0,
    duration: 2.0,
    easing: 'easeInOutQuad',
    to: {
      exposure: 0.0,
      baseLevel: 0.0,
      tint: '#ffffff',
      motionMode: 'Center Origin',
      ghostAudio: false,
      diagnosticMode: 'NONE',
      // Optics - High Edge Contrast
      edgeHotspotStrength: 8.0,
      edgeHotspotWidth: 0.15,
    },
    from: {
      exposure: 0.0,
      baseLevel: 0.0,
      ghostAudio: false,
    },
  },
  {
    name: 'Ignition (Center Impulse)',
    startTime: 2.0,
    duration: 3.0,
    easing: 'easeOutCubic',
    to: {
      exposure: 8.0, // Flash
      baseLevel: 0.0,
      ghostAudio: true,
      simulationSpeed: 2.5, // Fast
      decay: 0.25, // Sharp decay
      // Wide initial burst
      topSpreadNear: 0.1,
      bottomSpreadNear: 0.1,
    },
  },
  {
    name: 'Resonance (Gold Pulse)',
    startTime: 5.0,
    duration: 5.0,
    easing: 'easeInOutQuad',
    to: {
      exposure: 5.0,
      tint: '#FFB84D', // Signature Gold
      simulationSpeed: 0.8, // Slow, heavy
      decay: 0.1, // Long tails
      // Tighten beam to calibrated
      topSpreadNear: K1_HERO_PRESET.optics.topSpreadNear,
      bottomSpreadNear: K1_HERO_PRESET.optics.bottomSpreadNear,
      edgeHotspotStrength: 2.0, // Reduce edge glare
    },
  },
  {
    name: 'Flow (Linear Propagation)',
    startTime: 10.0,
    duration: 6.0,
    easing: 'linear',
    to: {
      motionMode: 'Left Origin',
      simulationSpeed: 1.2,
      decay: 0.15,
      // Asymmetric optics for flow?
      topSpreadFar: 0.08, // Widen the throw
    },
  },
  {
    name: 'Equilibrium (Settle)',
    startTime: 16.0,
    duration: 4.0,
    easing: 'easeOutCubic',
    to: {
      motionMode: 'Center Origin',
      tint: '#FFFFFF',
      exposure: K1_HERO_PRESET.visuals.exposure,
      baseLevel: K1_HERO_PRESET.visuals.baseLevel,
      simulationSpeed: K1_HERO_PRESET.physics.simulationSpeed,
      decay: K1_HERO_PRESET.physics.decay,
      // Return to calibrated optics
      topSpreadNear: K1_HERO_PRESET.optics.topSpreadNear,
      topSpreadFar: K1_HERO_PRESET.optics.topSpreadFar,
      edgeHotspotStrength: K1_HERO_PRESET.optics.edgeHotspotStrength,
      edgeHotspotWidth: K1_HERO_PRESET.optics.edgeHotspotWidth,
    },
  },
];

export const TIMELINE_DURATION = 20.0;
