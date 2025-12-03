# K1 Visual Regression Testing

## Purpose

Validates that ALL K1 visualization routes comply with the **CENTER ORIGIN MANDATE** - light MUST emanate symmetrically from the center of the LED strip.

## Routes Tested

| Route | Engine | Preset | What to Verify |
|-------|--------|--------|----------------|
| `/` | K1Engine | HERO | Symmetric light from center |
| `/simulator` | K1Engine | PHYSICAL | Symmetric light from center |

## Commands

### Capture Golden Frames (Manual)

```bash
npm run test:visual
```

This starts a dev server on port 3100, captures screenshots, and saves them to `tests/golden/center-origin/`.

### Run Playwright Tests

```bash
# Run tests (starts dev server automatically)
npx playwright test

# Update snapshots after intentional changes
npx playwright test --update-snapshots

# View test report
npx playwright show-report
```

## Failure Interpretation

### Test Fails = Possible Center Origin Violation

If visual regression tests fail:

1. **Check the diff images** - Look for asymmetric light patterns
2. **Review recent changes** to:
   - `app/k1/core/physics/useK1Physics.ts`
   - `app/engine/timeline/sequence.ts`
   - `app/k1/core/optics/presets.ts`
   - `app/engine/K1Engine.tsx`

### What to Look For

**CORRECT (Compliant):**
```
[.......●...........●.......]  ← Symmetric light from center
```

**WRONG (Violation):**
```
[●...........................●]  ← Light at edges
[●............................]  ← Light flowing from one side
```

## Files

| File | Purpose |
|------|---------|
| `capture.js` | Manual golden frame capture script |
| `test-center-origin.spec.ts` | Playwright test specification |
| `playwright.config.ts` | Playwright configuration (root) |
| `tests/golden/center-origin/` | Golden frame output directory |

## Related Documentation

- `/reference/CENTER_ORIGIN_MANDATE.md` - Full mandate documentation
- `/CLAUDE.md` - Center origin section in project instructions
