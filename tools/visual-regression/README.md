# Visual Regression Harness (Scaffold)

- Script: `node tools/visual-regression/capture.js`
- Dependency: `playwright` (install with `npm install -D playwright`).
- Target scenes: see `reference/Phase0_Capture_Plan.md` and store outputs under `tests/golden/manual/...` until automated capture is finalized.
- Next steps: point the script at a running `next dev`/`next start`, load canonical scenes, capture PNGs at fixed timestamps, and diff against goldens.
