Baseline captures (manual)

Add PNGs here before the automated visual-regression harness is wired. Naming convention:

```
tests/golden/manual/<Engine>/<Scene>/frame_0500.png
```

Include a short note per scene (YAML or markdown) with:
- engine: K1Engine | K1Simulation
- preset/mode: e.g., K1_HERO_V1, K1_PHYSICAL_V1
- motionMode: Center Origin | Left Origin | Right Origin
- timeline/heroMode flags
- resolution: 1920x1080
- seed/randomness: e.g., ghostAudio (yes/no), rng seed if available
- timestamp/commit: git commit hash when captured
