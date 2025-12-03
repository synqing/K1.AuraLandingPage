# Screenshot Archive Standards

This document defines how to capture, name, and archive screenshots for the K1 Lightwave project.

## Naming Convention

All screenshots **MUST** follow this format:

```
YYYY-MM-DD_HH:mm-<descriptive-name>.png
```

**Examples:**
- `2025-12-03_22:31-landing-center-origin-fixed.png`
- `2025-12-03_21:39-simulator-hero-mode.png`
- `2025-12-03_22:01-simulator-validation.png`

**Why this format?**
- **YYYY-MM-DD_HH:mm** - Exact capture timestamp enables correlation with commits/changes
- **descriptive-name** - Clearly states what the screenshot shows and its purpose
- Alphabetical sorting by date/time maintains chronological order

## Storage Location

All screenshots are stored in: **`docs/screenshots/`**

Do NOT commit screenshots to the project root.

## Screenshot Categories

### 1. **Validation Screenshots** (Reference/Approval)
Purpose: Verify engine output matches expected visual behaviour

**Naming:** `...-validation.png` or `...-<visual-target>.png`

Examples:
- `2025-12-03_22:02-landing-validation.png` - Landing page hero shot
- `2025-12-03_21:40-simulator-physical-mode.png` - Physical preset render
- `2025-12-03_22:01-simulator-validation.png` - Simulator validation pass

**Usage:** Compare against golden masters in visual regression testing

### 2. **Reference Screenshots** (Documentation)
Purpose: Document expected behaviour for future developers

**Naming:** `...-<preset-or-mode>-<descriptor>.png`

Examples:
- `2025-12-03_20:38-k1-main-landing.png` - Landing page hero (final approved version)
- `2025-12-03_21:39-simulator-hero-mode.png` - Hero mode example
- `2025-12-03_21:21-vis-lab-physical-shader-test.png` - Physics shader test

**Usage:** Include in project documentation, design specs, PR descriptions

### 3. **Diagnostic Screenshots** (Debug/Analysis)
Purpose: Investigate visual bugs or shader/physics issues

**Naming:** `...-diagnostic-<mode>.png`

Examples:
- `...-diagnostic-edges-only.png` - Edge diagnostic mode
- `...-diagnostic-collision-test.png` - Collision detection debug

**Usage:** Troubleshooting issues, attach to bug reports, NOT committed long-term

## Capturing Screenshots

### From the Landing Page
```bash
npm run dev
# Navigate to http://localhost:3000
# Use browser DevTools or screenshot tool
# Save with appropriate timestamp and name
```

### From the Simulator
```bash
npm run dev
# Navigate to http://localhost:3000/simulator
# Adjust presets/modes using Leva controls
# Use browser or screen capture tool
# Save with timestamp and descriptive name
```

### Using the PNG Export Button (if available)
Some components (like K1Simulation) have built-in PNG export:
- Click "Save PNG" in Leva controls
- Rename exported file to match standard format
- Move to `docs/screenshots/`

## Adding Screenshots to Documentation

When referencing a screenshot in markdown:

```markdown
### Physical Mode Example
See the validation screenshot from the last test run:
![Physical Mode](../../docs/screenshots/2025-12-03_21:40-simulator-physical-mode.png)

**Captured:** 2025-12-03 21:40
**Configuration:** K1_PHYSICAL_V1 preset, Center Origin motion, 160 LEDs
```

## Cleanup & Retention

- **Keep:** Validation screenshots and reference images used in tests
- **Delete:** Debug screenshots once the issue is resolved
- **Archive:** Important historical screenshots (golden masters, approved looks)

Cleanup happens quarterly or when screenshots directory grows beyond 100 files.

## Git Configuration

Screenshots directory is committed to the repo:
- `docs/screenshots/*.png` - tracked in git
- Root-level `*.png` files - **NOT committed** (see `.gitignore`)

This allows:
- Historical reference of approved visuals
- Comparison of changes over time
- Baseline for visual regression tests

## Related Documentation

- [Visual Regression Testing](tools/visual-regression/README.md)
- [Golden Master Baselines](tests/golden/manual/README.md)
- [K1 Engine Workflow](reference/K1Engine_WORKFLOW.md)
