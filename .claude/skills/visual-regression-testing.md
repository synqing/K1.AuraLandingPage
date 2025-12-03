---
name: visual-regression-testing
description: Visual regression testing workflow for K1 Engine using Playwright screenshots and golden image comparison. Use when verifying visual changes, updating baselines, or debugging visual regressions.
---

# Visual Regression Testing Skill

## When to Use This Skill

Use this skill when:
- Making visual changes to K1 Engine
- Modifying shaders, effects, or composition
- Updating visual presets
- Verifying UI changes haven't broken visuals
- Creating new golden baselines after intentional changes

## Prerequisites

1. Dev server running on port 3100 (or modify `DEV_PORT` in capture script)
2. Playwright installed (`npx playwright install chromium`)
3. Access to `tools/visual-regression/capture.js`

## Workflow

### Step 1: Capture Current State (Before Changes)

```bash
# Start dev server on port 3100
PORT=3100 npm run dev

# In another terminal, capture baseline
npm run test:visual
```

Screenshots saved to:
- `tests/golden/manual/K1Engine/` - Hero visualization
- `tests/golden/manual/K1Simulation/` - Physics simulation

### Step 2: Make Visual Changes

Modify shaders, presets, or components as needed.

### Step 3: Capture New State

```bash
npm run test:visual
```

### Step 4: Compare Images

Use one of these methods:

**Method A: Browser-based Chrome automation**
```typescript
// Use MCP tool for visual comparison
mcp__plugin_superpowers-chrome_chrome__use_browser({
  action: "navigate",
  payload: "file:///path/to/test/comparison.html"
});
```

**Method B: Manual comparison**
- Open both images in Preview/image viewer
- Toggle between them to spot differences

**Method C: Use ui-visual-validator agent**
```
Task tool with subagent_type="ui-visual-validator"
```

### Step 5: Update Baseline (If Changes Are Intentional)

```bash
# Move new captures to replace golden baselines
mv tests/golden/manual/K1Engine/new.png tests/golden/manual/K1Engine/baseline.png
```

## Capture Script Details

Located at: `tools/visual-regression/capture.js`

```javascript
// Key configuration
const DEV_PORT = 3100;
const VIEWPORT = { width: 1920, height: 1080 };
const SETTLE_TIME = 1600; // ms to wait for scene to stabilize

// Scenes captured
const SCENES = [
  { name: 'K1Engine', path: '/' },
  { name: 'K1Simulation', path: '/simulator' }
];
```

## Checklist for Visual Changes

Before submitting visual changes:

- [ ] Captured baseline BEFORE making changes
- [ ] Made changes incrementally (not all at once)
- [ ] Captured new screenshots AFTER changes
- [ ] Compared old vs new visually
- [ ] Verified no unintended side effects
- [ ] Updated golden baselines if changes are intentional
- [ ] Tested at 1920x1080 resolution
- [ ] Waited for scene settle time (1600ms minimum)

## Common Issues

### Scene Not Stabilized
- Increase `SETTLE_TIME` in capture script
- Ensure physics simulation has reached steady state
- Check for animation loops that never settle

### Resolution Mismatch
- Always capture at same resolution
- Use `VIEWPORT` constant consistently
- Account for device pixel ratio on Retina displays

### Flaky Comparisons
- Ensure deterministic rendering (no random values)
- Use fixed time seed for animations
- Disable anti-aliasing for pixel-perfect comparison

## Integration with CI/CD

Future enhancement: Add to GitHub Actions workflow:

```yaml
- name: Visual Regression Test
  run: |
    npm run dev &
    sleep 5
    npm run test:visual
    # Compare with stored baselines
```

## File Locations

| Path | Purpose |
|------|---------|
| `tools/visual-regression/capture.js` | Playwright capture script |
| `tools/visual-regression/README.md` | Visual testing guide |
| `tests/golden/manual/` | Golden baseline images |
