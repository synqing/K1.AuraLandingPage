import { DiagnosticMode } from '../useK1Physics';

/**
 * Parameters controllable by the timeline.
 * Matches the Leva controls in K1Engine.
 */
export type TimelineParamTarget = {
  // Visuals
  falloff?: number;
  exposure?: number;
  spread?: number;
  baseLevel?: number;
  tint?: string; // Hex color
  hueOffset?: number;
  autoColorShift?: boolean;

  // Optics
  topSpreadNear?: number;
  topSpreadFar?: number;
  bottomSpreadNear?: number;
  bottomSpreadFar?: number;
  topFalloff?: number;
  bottomFalloff?: number;
  columnBoostStrength?: number;
  columnBoostExponent?: number;
  edgeHotspotStrength?: number;
  edgeHotspotWidth?: number;
  prismCount?: number;
  prismOpacity?: number;
  railInner?: number;
  railOuter?: number;
  railSigma?: number;

  // Physics
  motionMode?: string;
  simulationSpeed?: number;
  decay?: number;
  ghostAudio?: boolean;

  // Diagnostics (Optional, for debug sequences)
  diagnosticMode?: DiagnosticMode;
};

/**
 * A single segment of the timeline.
 * Defines a transition from the previous state to a new state.
 */
export type TimelineSegment = {
  name: string;
  startTime: number; // seconds relative to start of sequence
  duration: number; // seconds
  easing?: 'linear' | 'easeInOutQuad' | 'easeOutCubic' | 'step';

  // Optional override for start values.
  // If omitted, interpolates from the previous segment"s end state.
  from?: TimelineParamTarget;

  // Target values at the end of this segment.
  to: TimelineParamTarget;
};

export type TimelineSequence = TimelineSegment[];
