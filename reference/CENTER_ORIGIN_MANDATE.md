# CENTER ORIGIN MANDATE

## Status: MANDATORY - NO EXCEPTIONS

**Last Updated:** 2025-12-03
**Applies To:** ALL K1 visualization code

---

## Summary

ALL K1 visualizations MUST inject light at the CENTER of the LED strip and propagate it SYMMETRICALLY outward. This is the signature visual identity of the K1 product.

**ANY CODE THAT VIOLATES THIS MANDATE IS A REGRESSION AND MUST BE REJECTED.**

---

## Visual Reference

### CORRECT (Center Origin)
```
[.......●...........●.......]  ← Symmetric injection at center ± offset
        ↑           ↑
     posLeft     posRight
```

Light emanates from center, spreads symmetrically to edges.

### WRONG (Edge/Random Origin)
```
[●...........................●]  ← Light at edges = BROKEN
[●............................]  ← Light at one side = BROKEN
[..●.........................]  ← Single point = BROKEN
```

---

## Implementation Requirements

### 1. Light Injection (MANDATORY PATTERN)

```typescript
// CENTER ORIGIN ENFORCED: Symmetric injection from center
const center = Math.floor(LED_COUNT / 2);  // center = 80 for 160 LEDs
const displacement = Math.abs(amplitude);
const offset = Math.floor(displacement * (center * 0.9));
const posLeft = Math.max(0, center - offset);
const posRight = Math.min(LED_COUNT - 1, center + offset);

// Inject at BOTH symmetric positions from center
addColor(field, posLeft, r, g, b, intensity);   // LEFT of center
addColor(field, posRight, r, g, b, intensity);  // RIGHT of center
```

### 2. LED Shift Direction

The `shiftLeds()` function MUST shift LEDs OUTWARD from center:
- Left half (indices 0-79): shifts LEFT (toward index 0)
- Right half (indices 80-159): shifts RIGHT (toward index 159)

```typescript
if (mode === 'Center Origin') {
  // Right half: push content rightward
  for (let i = LED_COUNT - 1; i > center; i--) copyPixel(leds, i, i - 1);
  // Left half: push content leftward
  for (let i = 0; i < center; i++) copyPixel(leds, i, i + 1);
}
```

### 3. Configuration Values

- `motionMode` MUST always be `'Center Origin'`
- `'Left Origin'` and `'Right Origin'` are DEPRECATED

---

## Files That MUST Respect This Mandate

| File | What to Check | Violation Example |
|------|---------------|-------------------|
| `app/k1/core/physics/useK1Physics.ts` | Snapwave AND Existing mode injection | Single `addColor()` call |
| `app/engine/timeline/sequence.ts` | ALL timeline segments | `motionMode: 'Left Origin'` |
| `app/k1/core/optics/presets.ts` | ALL presets | `motionMode: 'Right Origin'` |
| `app/engine/K1Engine.tsx` | Default Leva controls | Wrong default value |

---

## Regression Checklist

Before merging ANY visualization code:

- [ ] Does the code inject light at TWO symmetric positions (posLeft AND posRight)?
- [ ] Is `motionMode` hardcoded or defaulted to `'Center Origin'`?
- [ ] Does the timeline sequence NEVER change motionMode to anything other than 'Center Origin'?
- [ ] Does the shiftLeds function shift outward from center (left half left, right half right)?
- [ ] Visual validation: Does the rendered output show symmetric light columns?

---

## Anti-Patterns (PROHIBITED)

### 1. Single Point Injection
```typescript
// WRONG: Only one addColor call = no symmetry
const pos = center + amp * range;
addColor(field, pos, r, g, b, intensity);
```

### 2. Edge Injection
```typescript
// WRONG: Light at edges, not center
addColor(field, 0, r, g, b, intensity);           // Left edge
addColor(field, LED_COUNT - 1, r, g, b, intensity); // Right edge
```

### 3. Timeline Motion Override
```typescript
// WRONG: Changes motion mode away from center
{
  name: 'Some Segment',
  to: {
    motionMode: 'Left Origin',  // ← VIOLATION
  }
}
```

### 4. Preset Misconfiguration
```typescript
// WRONG: Preset with non-center origin
export const SOME_PRESET = {
  physics: {
    motionMode: 'Right Origin',  // ← VIOLATION
  }
};
```

---

## Enforcement

1. **Code Review**: Any PR touching visualization code MUST be checked against this mandate
2. **Visual Validation**: Screenshots MUST show symmetric center-origin behavior
3. **Automated Tests**: Future CI should include visual regression tests for center-origin

---

## History

- **2025-12-03**: Mandate established after discovering Snapwave mode violated center-origin
- **Root Cause**: Snapwave mode used single-point injection instead of symmetric pair
- **Fix**: Modified `useK1Physics.ts` to enforce symmetric injection in Snapwave mode
- **Timeline Fix**: Removed `motionMode: 'Left Origin'` from "Flow" timeline segment

---

## Contact

If you are unsure whether your code respects the center-origin mandate:
1. Read this document completely
2. Check the visual output against the reference images
3. Ask before shipping

**DO NOT GUESS. DO NOT SHIP CODE THAT MIGHT VIOLATE CENTER ORIGIN.**
