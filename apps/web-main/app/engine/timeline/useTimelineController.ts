import { useRef, useEffect, useState, useMemo } from 'react';
import { K1_HERO_TIMELINE, TIMELINE_DURATION } from './sequence';
import type { TimelineParamTarget, TimelineSegment } from './types';

interface UseTimelineControllerProps {
  enabled: boolean;
  loop: boolean;
  timelineTimeControl?: number; // Optional external time control (scrubbing)

  // Manual Fallback Params
  manualVisuals: {
    falloff: number;
    exposure: number;
    spread: number;
    baseLevel: number;
    tint: string;
  };
  manualPhysics: {
    motionMode: string;
    simulationSpeed: number;
    decay: number;
    ghostAudio: boolean;
  };
  manualDiagnostics: {
    diagnosticMode: string;
  };
}

// Simple Easing Functions
const EASINGS = {
  linear: (t: number) => t,
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  step: (t: number) => (t < 1 ? 0 : 1),
};

export function useTimelineController({
  enabled,
  loop,
  timelineTimeControl,
  manualVisuals,
  manualPhysics,
  manualDiagnostics,
}: UseTimelineControllerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const lastTimestamp = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // --- 1. TIMEBASE MANAGEMENT ---
  useEffect(() => {
    if (!enabled) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      lastTimestamp.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimestamp.current === null) lastTimestamp.current = timestamp;
      const delta = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      setCurrentTime((prev) => {
        let next = prev + delta;
        if (loop && next >= TIMELINE_DURATION) {
          next = next % TIMELINE_DURATION;
        } else if (!loop && next >= TIMELINE_DURATION) {
          next = TIMELINE_DURATION; // Clamp at end
        }
        return next;
      });

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [enabled, loop]);

  // Handle external scrubbing (Leva)
  useEffect(() => {
    if (timelineTimeControl !== undefined && enabled) {
      setCurrentTime(timelineTimeControl);
    }
  }, [timelineTimeControl, enabled]);

  // --- 2. INTERPOLATION ENGINE ---
  const interpolatedParams = useMemo(() => {
    if (!enabled) return null;

    // Find Active Segment
    let activeSegment: TimelineSegment | null = null;
    let segmentIndex = -1;

    for (let i = 0; i < K1_HERO_TIMELINE.length; i++) {
      const seg = K1_HERO_TIMELINE[i];
      if (currentTime >= seg.startTime && currentTime < seg.startTime + seg.duration) {
        activeSegment = seg;
        segmentIndex = i;
        break;
      }
    }

    // Fallback for gaps or pre-start
    if (!activeSegment) {
      if (currentTime >= TIMELINE_DURATION && K1_HERO_TIMELINE.length > 0) {
        // Post-timeline: hold last state
        const lastSeg = K1_HERO_TIMELINE[K1_HERO_TIMELINE.length - 1];
        return lastSeg.to;
      }
      return {}; // Empty if before start or no segments
    }

    // Calculate Progress (0 -> 1)
    const elapsed = currentTime - activeSegment.startTime;
    const rawProgress = Math.min(Math.max(elapsed / activeSegment.duration, 0), 1);

    const easingName = activeSegment.easing || 'linear';
    const easeFn = EASINGS[easingName as keyof typeof EASINGS] || EASINGS.linear;
    const p = easeFn(rawProgress);

    // Resolve From values
    const prevSegment = segmentIndex > 0 ? K1_HERO_TIMELINE[segmentIndex - 1] : null;

    const targetParams: TimelineParamTarget = {};
    const keys = Object.keys(activeSegment.to) as (keyof TimelineParamTarget)[];

    keys.forEach((key) => {
      const toVal = activeSegment.to[key];
      let fromVal: TimelineParamTarget[typeof key] | undefined = activeSegment.from
        ? activeSegment.from[key]
        : undefined;

      if (fromVal === undefined && prevSegment) {
        fromVal = prevSegment.to[key];
      }

      // If still undefined, fallback to manual
      if (fromVal === undefined) {
        if (key in manualVisuals) {
          fromVal = manualVisuals[
            key as keyof UseTimelineControllerProps['manualVisuals']
          ] as TimelineParamTarget[typeof key];
        } else if (key in manualPhysics) {
          fromVal = manualPhysics[
            key as keyof UseTimelineControllerProps['manualPhysics']
          ] as TimelineParamTarget[typeof key];
        } else if (key === 'diagnosticMode') {
          fromVal = manualDiagnostics.diagnosticMode as TimelineParamTarget['diagnosticMode'];
        }
      }

      // Interpolate
      if (typeof toVal === 'number' && typeof fromVal === 'number') {
        targetParams[key] = fromVal + (toVal - fromVal) * p;
      } else {
        // Strings, Booleans, Enums - Snap
        targetParams[key] = p < 0.5 ? fromVal : toVal;
      }
    });

    return targetParams;
  }, [currentTime, enabled, manualVisuals, manualPhysics, manualDiagnostics]);

  // --- 3. MERGE & OUTPUT ---
  const effectiveVisuals = { ...manualVisuals };
  const effectivePhysics = { ...manualPhysics };
  const effectiveDiagnostics = { ...manualDiagnostics };

  if (enabled && interpolatedParams) {
    // Visuals
    if (interpolatedParams.falloff !== undefined)
      effectiveVisuals.falloff = interpolatedParams.falloff;
    if (interpolatedParams.exposure !== undefined)
      effectiveVisuals.exposure = interpolatedParams.exposure;
    if (interpolatedParams.spread !== undefined)
      effectiveVisuals.spread = interpolatedParams.spread;
    if (interpolatedParams.baseLevel !== undefined)
      effectiveVisuals.baseLevel = interpolatedParams.baseLevel;
    if (interpolatedParams.tint !== undefined) effectiveVisuals.tint = interpolatedParams.tint;

    // Physics
    if (interpolatedParams.motionMode !== undefined)
      effectivePhysics.motionMode = interpolatedParams.motionMode;
    if (interpolatedParams.simulationSpeed !== undefined)
      effectivePhysics.simulationSpeed = interpolatedParams.simulationSpeed;
    if (interpolatedParams.decay !== undefined) effectivePhysics.decay = interpolatedParams.decay;
    if (interpolatedParams.ghostAudio !== undefined)
      effectivePhysics.ghostAudio = interpolatedParams.ghostAudio;

    // Diagnostics
    if (interpolatedParams.diagnosticMode !== undefined)
      effectiveDiagnostics.diagnosticMode = interpolatedParams.diagnosticMode;
  }

  return {
    effectiveVisuals,
    effectivePhysics,
    effectiveDiagnostics,
    currentTime,
  };
}
