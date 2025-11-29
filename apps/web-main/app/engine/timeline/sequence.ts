import { TimelineSequence } from './types';

export const K1_HERO_TIMELINE: TimelineSequence = [
  {
    name: 'Intro Fade In',
    startTime: 0.0,
    duration: 3.0,
    easing: 'easeInOutQuad',
    to: {
      exposure: 4.0,
      baseLevel: 0.2,
      tint: '#ffffff',
      motionMode: 'Center Origin',
      ghostAudio: true,
      simulationSpeed: 1.0,
      decay: 0.15,
      spread: 0.015,
      falloff: 1.5,
      diagnosticMode: 'NONE',
    },
    // Start from black/off
    from: {
      exposure: 0.0,
      baseLevel: 0.0,
      ghostAudio: false,
    },
  },
  {
    name: 'Build Energy',
    startTime: 3.0,
    duration: 5.0,
    easing: 'easeOutCubic',
    to: {
      exposure: 6.0,
      spread: 0.025,
      simulationSpeed: 1.5,
      decay: 0.12,
      tint: '#ffffff', // Keep white
    },
  },
  {
    name: 'Wide Wash (Color Shift)',
    startTime: 8.0,
    duration: 6.0,
    easing: 'easeInOutQuad',
    to: {
      spread: 0.05,
      exposure: 5.0,
      tint: '#ffbb66', // Warm gold
      motionMode: 'Left Origin',
      simulationSpeed: 0.8,
    },
  },
  {
    name: 'Calm Down',
    startTime: 14.0,
    duration: 4.0,
    easing: 'linear',
    to: {
      spread: 0.015,
      exposure: 4.0,
      tint: '#ffffff',
      motionMode: 'Center Origin',
      simulationSpeed: 1.0,
      decay: 0.15,
    },
  },
];

export const TIMELINE_DURATION = 18.0;
