# K1 Visual Regression Test

Run visual regression testing for the K1 Engine.

## Steps

1. **Check dev server status**
   - Verify if dev server is running on port 3100
   - If not, start it with `PORT=3100 npm run dev`

2. **Capture screenshots**
   - Run `npm run test:visual` to capture current state
   - Wait for Playwright to complete (captures at 1920x1080)

3. **Compare with baselines**
   - Check `tests/golden/manual/K1Engine/` for hero visualization
   - Check `tests/golden/manual/K1Simulation/` for physics simulation
   - Use the ui-visual-validator agent to analyze differences

4. **Report findings**
   - List any visual differences detected
   - Recommend whether to update baselines or investigate regressions

## Automatic Actions

When invoked, I will:
1. Check if dev server is running
2. Run the visual capture script
3. Compare new captures with existing baselines
4. Report visual differences with recommendations
